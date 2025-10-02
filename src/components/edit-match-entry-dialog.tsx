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
import { MatchEntry } from "@/lib/shared-types";

interface EditMatchEntryDialogProps {
  entry: MatchEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (entry: MatchEntry) => void;
}

export function EditMatchEntryDialog({
  entry,
  open,
  onOpenChange,
  onSave,
}: EditMatchEntryDialogProps) {
  const [formData, setFormData] = useState<MatchEntry | null>(null);
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
      toast.success("Match entry updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update match entry");
      console.error("Error updating match entry:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof MatchEntry, value: unknown) => {
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
          <DialogTitle>Edit Match Scouting Entry</DialogTitle>
          <DialogDescription>
            Update the match scouting data for Team {formData.teamNumber} in Match #{formData.matchNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="matchNumber">Match Number</Label>
              <Input
                id="matchNumber"
                type="number"
                value={formData.matchNumber}
                onChange={(e) => handleChange("matchNumber", parseInt(e.target.value))}
              />
            </div>
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
              <Label htmlFor="alliance">Alliance</Label>
              <Select
                value={formData.alliance}
                onValueChange={(value: 'red' | 'blue') => handleChange("alliance", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select alliance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="red">Red</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={3}
            />
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