import logging
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.auth import get_current_user, require_role
from app.models.schemas import (
    CopilotChatRequest,
    CopilotChatResponse,
    CopilotActionResponse,
    UserResponse,
)
from app.services.groq_service import copilot_service
from app.services.copilot_tools import execute_tool, ALLOWED_TOOLS
from app.services.conversation_repo import (
    ConversationDBError,
    create_conversation,
    get_conversation,
    add_message,
    get_history_for_groq,
    touch_conversation,
    ensure_tables_exist,
    _generate_title,
)
from app.core.config import settings

logger = logging.getLogger("naviops.copilot.api")

router = APIRouter(prefix="/api/copilot", tags=["Bob Copilot"])

# History max turns to send to Groq — keeps request size bounded
_MAX_HISTORY_TURNS = 10

# Run migration guard once at module load (non-fatal if DB is unavailable)
try:
    ensure_tables_exist()
except Exception:
    pass


@router.post("/chat", response_model=CopilotChatResponse)
def copilot_chat(
    payload: CopilotChatRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Send a message to Bob Copilot and receive an AI-generated operational response.

    Persistence behaviour:
    - If conversation_id is omitted, a new conversation is created automatically.
    - If conversation_id is provided, ownership is verified before use.
    - The user message and final assistant reply are both persisted.
    - Database history is the source of truth; any client-supplied history is ignored.
    - If the database is unavailable, chat still functions using the in-request
      history field as a fallback, but the conversation is not persisted.
    - Read-only: this endpoint never modifies operational NaviOps state.
    """
    if not payload.message.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Message must not be empty.",
        )

    user_message = payload.message.strip()
    db_available = True
    conversation_id: str | None = payload.conversation_id

    # ------------------------------------------------------------------
    # 1. Resolve or create conversation
    # ------------------------------------------------------------------
    if conversation_id:
        # Verify ownership server-side — never trust the frontend ID alone
        try:
            conv = get_conversation(conversation_id=conversation_id, user_id=current_user.id)
            if conv is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Conversation not found.",
                )
        except ConversationDBError:
            db_available = False
            logger.warning(
                "DB unavailable during conversation lookup | conv=%s | user=%s",
                conversation_id, current_user.email,
            )
    else:
        # Auto-create a new conversation
        title = _generate_title(user_message)
        try:
            conv_row = create_conversation(user_id=current_user.id, title=title)
            conversation_id = conv_row["id"]
        except ConversationDBError:
            db_available = False
            conversation_id = None
            logger.warning(
                "DB unavailable; chat proceeding without persistence | user=%s",
                current_user.email,
            )

    # ------------------------------------------------------------------
    # 2. Build Groq history from database (or client fallback)
    # ------------------------------------------------------------------
    if db_available and conversation_id:
        history = get_history_for_groq(
            conversation_id=conversation_id,
            max_turns=_MAX_HISTORY_TURNS,
        )
    else:
        # Fallback: use client-supplied history (legacy behaviour)
        raw_history = payload.history or []
        bounded = raw_history[-_MAX_HISTORY_TURNS:] if len(raw_history) > _MAX_HISTORY_TURNS else raw_history
        history = [{"role": m.role, "content": m.content} for m in bounded] if bounded else []

    # ------------------------------------------------------------------
    # 3. Persist the user message before calling Groq
    # ------------------------------------------------------------------
    if db_available and conversation_id:
        try:
            add_message(
                conversation_id=conversation_id,
                role="user",
                content=user_message,
            )
        except ConversationDBError:
            db_available = False
            logger.warning(
                "Failed to persist user message | conv=%s | user=%s",
                conversation_id, current_user.email,
            )

    # ------------------------------------------------------------------
    # 4. Tool executor — binds authenticated user to every tool call
    # ------------------------------------------------------------------
    def _tool_executor(tool_name: str, arguments: dict) -> dict:
        return execute_tool(tool_name, arguments, current_user)

    # ------------------------------------------------------------------
    # 5. Groq inference
    # ------------------------------------------------------------------
    try:
        reply, tools_used = copilot_service.chat(
            user_message=user_message,
            history=history or None,
            user_role=current_user.role,
            tool_executor=_tool_executor,
        )
    except RuntimeError as exc:
        error_msg = str(exc)
        if "GROQ_API_KEY" in error_msg or "not installed" in error_msg:
            logger.error("Copilot configuration error: %s", error_msg)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Bob Copilot is not configured. Please contact your NaviOps administrator.",
            )
        logger.warning(
            "Copilot inference error | user=%s | error=%s",
            current_user.email,
            error_msg,
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=error_msg,
        )

    # ------------------------------------------------------------------
    # 6. Persist the successful assistant reply
    # ------------------------------------------------------------------
    if db_available and conversation_id:
        try:
            add_message(
                conversation_id=conversation_id,
                role="assistant",
                content=reply,
            )
            touch_conversation(conversation_id)
        except ConversationDBError:
            # Non-fatal: the user still gets their response
            logger.warning(
                "Failed to persist assistant reply | conv=%s | user=%s",
                conversation_id, current_user.email,
            )

    return CopilotChatResponse(
        reply=reply,
        session_id=conversation_id or payload.session_id,
        conversation_id=conversation_id,
        model=settings.GROQ_MODEL,
        role_context=current_user.role,
        tools_used=tools_used if tools_used else None,
    )


@router.post(
    "/action/run-optimization",
    response_model=CopilotActionResponse,
    status_code=status.HTTP_200_OK,
)
def copilot_run_optimization(
    current_user: UserResponse = Depends(require_role(["admin", "operations"])),
):
    """
    Confirmed Copilot action: generate a new 72-hour CP-SAT optimization plan.

    - Requires explicit user confirmation before this endpoint is called.
    - Restricted to admin and operations roles (mirrors existing /api/optimization/run).
    - Runs the existing PortOptimizer — does NOT apply the plan automatically.
    - The plan must be separately approved via /api/optimization/apply (admin only).
    - Read safety: this generates a PROPOSED plan; no vessel/berth state is changed.
    """
    from app.core.database import port_repo
    from app.optimization.optimizer import PortOptimizer

    logger.info(
        "Copilot action: run-optimization | user=%s | role=%s",
        current_user.email,
        current_user.role,
    )

    try:
        optimizer = PortOptimizer(
            vessels=list(port_repo.vessels.values()),
            berths=list(port_repo.berths.values()),
            cranes=list(port_repo.cranes.values()),
            disruptions=list(port_repo.disruptions.values()),
            horizon_hours=72,
        )
        run_result = optimizer.solve()
        run_id = run_result["id"]

        # Store in memory repository (same as existing /api/optimization/run)
        port_repo.optimization_runs[run_id] = run_result
        schedules_data = []
        for item in run_result["schedules"]:
            item_dict = item.model_dump()
            dict.__setitem__(port_repo.schedules, item.id, item_dict)
            schedules_data.append(item_dict)
        port_repo.persist_items_batch("schedules", schedules_data)

        schedules = run_result.get("schedules", [])
        metrics = run_result.get("metrics", {})
        vessels_scheduled = len(schedules)
        total_wait = run_result.get("total_waiting_time", 0)
        avg_wait = round(total_wait / max(1, vessels_scheduled), 1)

        logger.info(
            "Copilot optimization complete | run_id=%s | vessels=%d | avg_wait=%.1fh",
            run_id,
            vessels_scheduled,
            avg_wait,
        )

        return CopilotActionResponse(
            action="run_optimization",
            status="success",
            message=(
                f"72-hour optimization plan generated successfully. "
                f"{vessels_scheduled} vessel(s) scheduled. "
                f"Average expected waiting time: {avg_wait}h. "
                f"Status: {run_result.get('status', 'OPTIMAL')}. "
                f"This plan has NOT been applied. A Port Manager can apply it from the Optimization page."
            ),
            result={
                "run_id": run_id,
                "solver_status": run_result.get("status"),
                "vessels_scheduled": vessels_scheduled,
                "total_waiting_time_hours": round(total_wait, 1),
                "avg_waiting_time_hours": avg_wait,
                "delay_reduction_pct": metrics.get("delay_reduction_pct"),
                "applied": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
        )

    except Exception as exc:
        logger.error(
            "Copilot optimization action failed | user=%s | error=%s",
            current_user.email,
            type(exc).__name__,
            exc_info=False,
        )
        return CopilotActionResponse(
            action="run_optimization",
            status="error",
            message="The optimization run failed. Please try again or use the Optimization page directly.",
            result=None,
        )


@router.get("/status")
def copilot_status(current_user: UserResponse = Depends(get_current_user)):
    """Health check for Copilot configuration — does NOT call Groq API."""
    configured = bool(settings.GROQ_API_KEY)
    return {
        "copilot": "Bob Copilot",
        "phase": "3",
        "configured": configured,
        "model": settings.GROQ_MODEL if configured else None,
        "status": "ready" if configured else "unconfigured",
        "tools_available": sorted(ALLOWED_TOOLS) if configured else [],
        "actions_available": ["run_optimization"] if configured else [],
    }
