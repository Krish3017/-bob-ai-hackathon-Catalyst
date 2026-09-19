"use client";

import React, { useState } from "react";
import { Modal } from "@/design-system/modal";
import { Button } from "@/design-system/button";
import { FormField, Input, Select } from "@/design-system/form-field";
import { api } from "@/lib/api";
import { Vessel } from "@/types";
import { useToast } from "@/components/design-system/toast";

interface AddVesselModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddVesselModal({ isOpen, onClose, onSuccess }: AddVesselModalProps) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [formData, setFormData] = useState({
    vessel_code: `IMO-${Math.floor(1000000 + Math.random() * 9000000)}`,
    vessel_name: "",
    shipping_line: "Maersk",
    cargo_type: "Container",
    cargo_volume: 1200,
    vessel_length: 330,
    eta_hours: 6,
    priority: 2,
    status: "Scheduled",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vessel_name.trim()) {
      toast.warning("Vessel name required", "Please specify a name for the incoming vessel.");
      return;
    }
    setLoading(true);
    try {
      const now = new Date();
      const eta = new Date(now.getTime() + formData.eta_hours * 3600 * 1000).toISOString();
      const etd = new Date(now.getTime() + (formData.eta_hours + 24) * 3600 * 1000).toISOString();

      await api.createVessel({
        vessel_code: formData.vessel_code,
        vessel_name: formData.vessel_name.trim(),
        shipping_line: formData.shipping_line,
        cargo_type: formData.cargo_type,
        cargo_volume: Number(formData.cargo_volume),
        vessel_length: Number(formData.vessel_length),
        eta,
        etd,
        priority: Number(formData.priority),
        status: formData.status as any,
        expected_waiting_time: 2.0,
      });

      toast.success(
        "Vessel registered",
        `${formData.vessel_name.trim()} added to the quayside scheduling queue.`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(
        "Unable to register vessel",
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
      title="Register Incoming Vessel"
      description="Add a commercial vessel arrival notification to the quayside scheduling queue."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Vessel IMO / Code" required>
            <Input
              value={formData.vessel_code}
              onChange={(e) => setFormData({ ...formData, vessel_code: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Vessel Name" required>
            <Input
              placeholder="e.g. MSC Geneva"
              value={formData.vessel_name}
              onChange={(e) => setFormData({ ...formData, vessel_name: e.target.value })}
              required
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Shipping Line" required>
            <Select
              value={formData.shipping_line}
              onChange={(e) => setFormData({ ...formData, shipping_line: e.target.value })}
            >
              <option value="Maersk">Maersk</option>
              <option value="MSC">MSC</option>
              <option value="CMA CGM">CMA CGM</option>
              <option value="COSCO">COSCO</option>
              <option value="Hapag-Lloyd">Hapag-Lloyd</option>
              <option value="Evergreen">Evergreen</option>
              <option value="ONE">ONE</option>
              <option value="ZIM">ZIM</option>
            </Select>
          </FormField>

          <FormField label="Cargo Category">
            <Select
              value={formData.cargo_type}
              onChange={(e) => setFormData({ ...formData, cargo_type: e.target.value })}
            >
              <option value="Container">Container</option>
              <option value="Bulk">Bulk Carrier</option>
              <option value="Ro-Ro">Ro-Ro</option>
              <option value="Liquid">Liquid / Tanker</option>
              <option value="General Cargo">General Cargo</option>
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <FormField label="Volume (TEU / Tons)" required>
            <Input
              type="number"
              min={100}
              max={25000}
              value={formData.cargo_volume}
              onChange={(e) => setFormData({ ...formData, cargo_volume: Number(e.target.value) })}
              required
            />
          </FormField>

          <FormField label="Length (Meters)" required>
            <Input
              type="number"
              min={50}
              max={450}
              value={formData.vessel_length}
              onChange={(e) => setFormData({ ...formData, vessel_length: Number(e.target.value) })}
              required
            />
          </FormField>

          <FormField label="Arrival in Hours">
            <Input
              type="number"
              min={0}
              max={72}
              value={formData.eta_hours}
              onChange={(e) => setFormData({ ...formData, eta_hours: Number(e.target.value) })}
              required
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Priority Tier">
            <Select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
            >
              <option value={1}>Priority 1 (Critical Express)</option>
              <option value={2}>Priority 2 (Standard High)</option>
              <option value={3}>Priority 3 (Regular Feeder)</option>
              <option value={4}>Priority 4 (Low / Flexible)</option>
            </Select>
          </FormField>

          <FormField label="Initial Status">
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Waiting">Waiting at Anchorage</option>
              <option value="Delayed">Delayed Inbound</option>
            </Select>
          </FormField>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[#F0EDE4]">
          <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={loading}>
            Add Vessel to Schedule
          </Button>
        </div>
      </form>
    </Modal>
  );
}
