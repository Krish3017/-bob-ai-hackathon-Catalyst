"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/design-system/modal";
import { Button } from "@/design-system/button";
import { FormField, Input, Select } from "@/design-system/form-field";
import { api } from "@/lib/api";
import { useToast } from "@/components/design-system/toast";
import { useConfirm } from "@/components/design-system/confirm-dialog";

interface UpdateResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  resourceType: "vessel" | "berth" | "crane" | "yard";
  resource: any;
}

export function UpdateResourceModal({
  isOpen,
  onClose,
  onSuccess,
  resourceType,
  resource,
}: UpdateResourceModalProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>(resource?.status || "");
  const [priority, setPriority] = useState<number>(resource?.priority || 2);
  const [occupiedCapacity, setOccupiedCapacity] = useState<number>(
    resource?.occupied_capacity || 0
  );
  const [expectedWait, setExpectedWait] = useState<number>(
    resource?.expected_waiting_time || 0
  );
  const toast = useToast();
  const confirm = useConfirm();

  // Ensure state synchronizes immediately whenever a different resource is selected or modal opens
  useEffect(() => {
    if (resource) {
      setStatus(resource.status || "");
      setPriority(resource.priority ?? 2);
      setOccupiedCapacity(resource.occupied_capacity ?? 0);
      setExpectedWait(resource.expected_waiting_time ?? 0);
    }
  }, [resource, isOpen]);

  if (!resource) return null;

  const resourceName =
    resource.vessel_name || resource.berth_code || resource.crane_code || resource.yard_code || "Resource";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      (resourceType === "berth" || resourceType === "crane") &&
      (status === "Under Maintenance" || status === "Maintenance" || status === "Offline") &&
      resource.status !== status
    ) {
      const confirmed = await confirm({
        title: `Mark ${resourceName} offline?`,
        description: `Changing status to "${status}" will remove this resource from automated scheduling and operational allocation. Continue?`,
        confirmText: "Mark offline",
        cancelText: "Cancel",
        variant: "warning",
      });
      if (!confirmed) return;
    }

    setLoading(true);
    try {
      if (resourceType === "vessel") {
        await api.updateVessel(resource.id, {
          status: status as any,
          priority: Number(priority),
          expected_waiting_time: Number(expectedWait),
        });
      } else if (resourceType === "berth") {
        await api.updateBerth(resource.id, {
          status: status as any,
        });
      } else if (resourceType === "crane") {
        await api.updateCrane(resource.id, {
          status: status as any,
        });
      } else if (resourceType === "yard") {
        await api.updateYard(resource.id, {
          occupied_capacity: Number(occupiedCapacity),
        });
      }

      toast.success(
        "Resource updated",
        `${resourceName} details updated successfully.`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(
        "Failed to update resource",
        err.message || "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  const title = `Update ${resourceType.toUpperCase()}: ${
    resource.vessel_name || resource.berth_code || resource.crane_code || resource.yard_code
  }`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description="Update real-time operational status, availability, or capacity parameters."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {resourceType === "vessel" && (
          <>
            <FormField label="Operational Status">
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Scheduled">Scheduled</option>
                <option value="Arrived">Arrived</option>
                <option value="Waiting">Waiting (Anchorage)</option>
                <option value="Berthing">Berthing</option>
                <option value="Loading">Loading Operations</option>
                <option value="Unloading">Unloading Operations</option>
                <option value="Completed">Completed / Departed</option>
                <option value="Delayed">Delayed Inbound</option>
              </Select>
            </FormField>

            <FormField label="Priority Tier">
              <Select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
              >
                <option value={1}>Priority 1 (Critical Express)</option>
                <option value={2}>Priority 2 (High)</option>
                <option value={3}>Priority 3 (Standard)</option>
                <option value={4}>Priority 4 (Low)</option>
              </Select>
            </FormField>

            <FormField label="Expected Waiting Time (Hours)">
              <Input
                type="number"
                step="0.5"
                min="0"
                value={expectedWait}
                onChange={(e) => setExpectedWait(Number(e.target.value))}
              />
            </FormField>
          </>
        )}

        {resourceType === "berth" && (
          <FormField label="Berth Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="Maintenance">Under Maintenance</option>
              <option value="Unavailable">Unavailable</option>
            </Select>
          </FormField>
        )}

        {resourceType === "crane" && (
          <FormField label="Quay Crane Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Available">Available (Ready)</option>
              <option value="Busy">Busy (Active Lift)</option>
              <option value="Maintenance">Scheduled Maintenance</option>
              <option value="Failed">Mechanical / Electrical Failure</option>
            </Select>
          </FormField>
        )}

        {resourceType === "yard" && (
          <FormField
            label={`Occupied Capacity (Max: ${resource.total_capacity} TEU)`}
          >
            <Input
              type="number"
              min="0"
              max={resource.total_capacity}
              value={occupiedCapacity}
              onChange={(e) => setOccupiedCapacity(Number(e.target.value))}
            />
          </FormField>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-[#F0EDE4]">
          <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={loading}>
            Save Operational Update
          </Button>
        </div>
      </form>
    </Modal>
  );
}
