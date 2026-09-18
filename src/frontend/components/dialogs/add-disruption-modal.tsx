"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/design-system/modal";
import { Button } from "@/design-system/button";
import { FormField, Input, Select, Textarea } from "@/design-system/form-field";
import { api } from "@/lib/api";
import { Berth, Crane, Yard } from "@/types";
import { useToast } from "@/components/design-system/toast";

interface AddDisruptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  berths: Berth[];
  cranes: Crane[];
  yards?: Yard[];
}

export function AddDisruptionModal({
  isOpen,
  onClose,
  onSuccess,
  berths,
  cranes,
  yards = [],
}: AddDisruptionModalProps) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [formData, setFormData] = useState({
    disruption_type: "Equipment Failure",
    title: "",
    description: "",
    affected_resource_type: "crane",
    affected_resource_id: "",
    severity: "High",
  });

  // Ensure default affected_resource_id is properly initialized whenever modal opens or resources load
  useEffect(() => {
    if (isOpen) {
      if (formData.affected_resource_type === "crane" && cranes.length > 0) {
        setFormData((prev) => ({ ...prev, affected_resource_id: prev.affected_resource_id || cranes[0].id }));
      } else if (formData.affected_resource_type === "berth" && berths.length > 0) {
        setFormData((prev) => ({ ...prev, affected_resource_id: prev.affected_resource_id || berths[0].id }));
      } else if (formData.affected_resource_type === "yard" && yards.length > 0) {
        setFormData((prev) => ({ ...prev, affected_resource_id: prev.affected_resource_id || yards[0].id }));
      }
    }
  }, [isOpen, cranes, berths, yards, formData.affected_resource_type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.warning("Title required", "Please provide an incident title.");
      return;
    }
    setLoading(true);
    try {
      await api.createDisruption({
        disruption_type: formData.disruption_type,
        title: formData.title.trim(),
        description: formData.description.trim(),
        affected_resource_type: formData.affected_resource_type as any,
        affected_resource_id:
          formData.affected_resource_type === "port" ? null : formData.affected_resource_id || null,
        severity: formData.severity as any,
        status: "Active",
      });

      toast.success(
        "Disruption reported",
        `${formData.title.trim()} logged to the operational incident register.`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(
        "Unable to report disruption",
        err.message || "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Operational Disruption"
      description="Inject an incident to simulate impact on port capacity and trigger automatic congestion recalculation."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Incident Type" required>
            <Select
              value={formData.disruption_type}
              onChange={(e) => setFormData({ ...formData, disruption_type: e.target.value })}
            >
              <option value="Equipment Failure">Equipment Failure</option>
              <option value="Berth Maintenance">Berth Maintenance</option>
              <option value="Weather">Adverse Weather / Fog</option>
              <option value="Yard Congestion">Yard Stacking Bottleneck</option>
              <option value="Labor Shortage">Labor / Gang Shortage</option>
            </Select>
          </FormField>

          <FormField label="Severity Level" required>
            <Select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
            >
              <option value="Critical">Critical (+10 Congestion Pts)</option>
              <option value="High">High (+5 Congestion Pts)</option>
              <option value="Medium">Medium (+2 Congestion Pts)</option>
              <option value="Low">Low (+1 Congestion Pt)</option>
            </Select>
          </FormField>
        </div>

        <FormField label="Incident Title" required>
          <Input
            placeholder="e.g. CR-02 Power Inverter Trip"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Affected Resource Type" required>
            <Select
              value={formData.affected_resource_type}
              onChange={(e) => {
                const newType = e.target.value;
                let defaultId = "";
                if (newType === "crane") defaultId = cranes[0]?.id || "";
                else if (newType === "berth") defaultId = berths[0]?.id || "";
                else if (newType === "yard") defaultId = yards[0]?.id || "";
                setFormData({
                  ...formData,
                  affected_resource_type: newType,
                  affected_resource_id: defaultId,
                });
              }}
            >
              <option value="crane">Quay Crane (STS)</option>
              <option value="berth">Berth Terminal</option>
              <option value="yard">Yard Zone</option>
              <option value="port">Port-Wide / Fairway</option>
            </Select>
          </FormField>

          {formData.affected_resource_type === "crane" && (
            <FormField label="Select Crane" required>
              <Select
                value={formData.affected_resource_id}
                onChange={(e) => setFormData({ ...formData, affected_resource_id: e.target.value })}
              >
                {cranes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.crane_code} — {c.crane_name} ({c.status})
                  </option>
                ))}
              </Select>
            </FormField>
          )}

          {formData.affected_resource_type === "berth" && (
            <FormField label="Select Berth" required>
              <Select
                value={formData.affected_resource_id}
                onChange={(e) => setFormData({ ...formData, affected_resource_id: e.target.value })}
              >
                {berths.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.berth_code} — {b.berth_name} ({b.status})
                  </option>
                ))}
              </Select>
            </FormField>
          )}

          {formData.affected_resource_type === "yard" && (
            <FormField label="Select Yard Zone" required>
              <Select
                value={formData.affected_resource_id}
                onChange={(e) => setFormData({ ...formData, affected_resource_id: e.target.value })}
              >
                {yards.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.yard_code} — {y.yard_name} ({y.status})
                  </option>
                ))}
              </Select>
            </FormField>
          )}
        </div>

        <FormField label="Operational Description & Mitigations">
          <Textarea
            placeholder="Provide engineering context, expected resolution duration, and pilotage advisory..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </FormField>

        <div className="flex justify-end gap-2 pt-3 border-t border-[#F0EDE4]">
          <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" type="submit" isLoading={loading}>
            Inject Disruption Incident
          </Button>
        </div>
      </form>
    </Modal>
  );
}
