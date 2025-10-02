"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PitEntry } from "@/lib/shared-types";

interface EditPitEntryDialogProps {
  entry: PitEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (entry: PitEntry) => void;
}

const DRIVE_TRAIN_OPTIONS = ["Swerve", "Mecanum", "Tank", "Other"];

export function EditPitEntryDialog({
  entry,
  open,
  onOpenChange,
  onSave,
}: EditPitEntryDialogProps) {
  const [formData, setFormData] = useState<PitEntry | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entry) {
      setFormData({ ...entry });
    }
  }, [entry]);

  const handleSave = async () => {
    if (!formData) return;

    setLoading(true);
    try {
      await onSave(formData);
      toast.success("Pit entry updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update pit entry");
      console.error("Error updating pit entry:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof PitEntry, value: unknown) => {
    if (!formData) return;
    setFormData({ ...formData, [field]: value });
  };

  const handleGameSpecificChange = (field: string, value: string | number | boolean) => {
    if (!formData) return;
    setFormData({
      ...formData,
      gameSpecificData: {
        ...formData.gameSpecificData,
        [field]: value,
      },
    });
  };

  if (!formData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Pit Scouting Entry</DialogTitle>
          <DialogDescription>
            Update the pit scouting data for Team {formData.teamNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="teamNumber">Team Number</Label>
              <Input
                id="teamNumber"
                type="number"
                value={formData.teamNumber}
                onChange={(e) => handleChange("teamNumber", parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="driveTrain">Drive Train</Label>
              <Select
                value={formData.driveTrain}
                onValueChange={(value) => handleChange("driveTrain", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select drive train" />
                </SelectTrigger>
                <SelectContent>
                  {DRIVE_TRAIN_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (lbs)</Label>
              <Input
                id="weight"
                type="number"
                value={formData.weight}
                onChange={(e) => handleChange("weight", parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="length">Length (in)</Label>
              <Input
                id="length"
                type="number"
                value={formData.length}
                onChange={(e) => handleChange("length", parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="width">Width (in)</Label>
              <Input
                id="width"
                type="number"
                value={formData.width}
                onChange={(e) => handleChange("width", parseFloat(e.target.value))}
              />
            </div>
          </div>

          {/* Game-specific fields */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Game-Specific Data</Label>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(formData.gameSpecificData).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key} className="capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </Label>
                  {typeof value === 'boolean' ? (
                    <Select
                      value={value ? 'true' : 'false'}
                      onValueChange={(val) => handleGameSpecificChange(key, val === 'true')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : typeof value === 'number' ? (
                    <Input
                      id={key}
                      type="number"
                      value={value}
                      onChange={(e) => handleGameSpecificChange(key, parseFloat(e.target.value))}
                    />
                  ) : (
                    <Input
                      id={key}
                      value={value as string}
                      onChange={(e) => handleGameSpecificChange(key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}