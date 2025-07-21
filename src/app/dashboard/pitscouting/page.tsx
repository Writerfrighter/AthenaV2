"use client";
import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Page() {
  const [formData, setFormData] = useState({
    team: "",
    autoScore: "",
    teleopScore: "",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Scouting Data:", formData);
    // Optionally save to localStorage or backend`
  };

  const registerServiceWorker = () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => alert("Offline access enabled! 📦"))
        .catch((err) =>
          console.error("Service Worker registration failed:", err)
        );
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Scout a Team</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="team" className="mb-2">
                Team Number
              </Label>
              <Input
                name="team"
                value={formData.team}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="autoScore" className="mb-2">
                Autonomous Score
              </Label>
              <Input
                name="autoScore"
                value={formData.autoScore}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="teleopScore" className="mb-2">
                Teleop Score
              </Label>
              <Input
                name="teleopScore"
                value={formData.teleopScore}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="notes" className="mb-2">
                Notes
              </Label>
              <Textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>
            <Button type="submit">Save Scouting Data</Button>
          </form>
        </CardContent>
        <CardFooter>
          <Button variant="secondary" onClick={registerServiceWorker}>
            Enable Offline Mode 🔄
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
