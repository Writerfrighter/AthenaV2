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
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { db } from "@/db/db";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { ModeToggle } from "@/components/ui/light-dark-toggle";

type FormData = {
  team: string;
  name: string;
  drivetrain: string;
  length: string;
  width: string;
  weight: string;
  hasAuto: boolean;
  notes: string;
};

const formDefault: FormData = {
  team: "",
  name: "",
  drivetrain: "",
  length: "",
  width: "",
  weight: "",
  hasAuto: false,
  notes: "",
};

export default function Page() {
  const [formData, setFormData] = useState(formDefault);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
  };

  // for our boolean switch we use onCheckedChange
  const handleToggleAuto = (checked: boolean) => {
    setFormData((f) => ({ ...f, hasAuto: checked }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Scouting Data:", formData);

    // build the object to save, casting strings to the right types
    const entryToSave = {
      teamNumber: Number(formData.team),
      name: formData.name,
      drivetrain: formData.drivetrain,
      weight: Number(formData.weight),
      length: Number(formData.length),
      width: Number(formData.width),
      // if you have more fields in formData, you can spread them:
      ...Object.fromEntries(
        Object.entries(formData).filter(([key]) => key !== "team")
      ),
    };

    db.pitEntries
      .add(entryToSave)
      .then(() => {
        toast("Scouting data saved!",{description: `Team ${formData.team} entry stored locally.`});
        setFormData(formDefault);
      })
      .catch((error) => {
        toast("Failed to save data",{description: error.message});
      });
  };


  const registerServiceWorker = () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => 
          toast("Offfine access enabled! 📦", {
            description:"You can now load this page without access to WiFi."
          }))
        .catch((err) =>
          console.error("Service Worker registration failed:", err)
        );
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        {/* <CardHeader>
          <CardTitle>Scout a Team</CardTitle>
        </CardHeader> */}
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <h1><b>General</b></h1>
              <div>
                <Label htmlFor="team" className="mb-2">
                  Team Number
                </Label>
                <Input
                  name="team"
                  type='number'
                  value={formData.team}
                  onChange={handleChange}
                  placeholder="492"
                  required
                />
              </div>
              <div>
                <Label htmlFor="name" className="mb-2">
                  Team Name
                </Label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Titan Robotics Club"
                  required
                />
              </div>
              <div>
                <Label htmlFor="drivetrain" className="mb-2">
                  Drivetrain
                </Label>
                <Select name="drivetrain">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a Drivetrain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Drivetrains</SelectLabel>
                      <SelectItem value="Swerve">Swerve</SelectItem>
                      <SelectItem value="Mecanum">Mecanum</SelectItem>
                      <SelectItem value="Tank">Tank</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex">
                <div className="flex-1 me-3">
                  <Label htmlFor="length" className="mb-2">
                    Length (in)
                  </Label>
                  <Input
                    name="length"
                    type='number'
                    value={formData.length}
                    onChange={handleChange}
                    placeholder="100"
                    required
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="width" className="mb-2">
                    Width (in)
                  </Label>
                  <Input
                    name="width"
                    type='number'
                    value={formData.width}
                    onChange={handleChange}
                    placeholder="100"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="weight" className="mb-2">
                  Weight (ib)
                </Label>
                <Input
                  name="weight"
                  type='number'
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="100"
                  required
                />
              </div>
              <div className="flex items-center space-x-3">
                <Label htmlFor="hasAuto">Has Auto?</Label>
                <Switch
                  id="hasAuto"
                  checked={formData.hasAuto}
                  className="transform scale-110 origin-center"
                  onCheckedChange={handleToggleAuto}
                />
              </div>
            </div>
            {formData.hasAuto && (
              
              <div className="space-y-4 border-l-4 border-primary pl-4">
                <h2 className="font-bold">Auto Details</h2>

                <div>
                  <Label htmlFor="autoDistance" className="mb-2">Auto Reach (in)</Label>
                  <Input
                    id="autoDistance"
                    name="autoDistance"
                    type="number"
                    value={(formData as { autoDistance?: string }).autoDistance || ""}
                    onChange={handleChange}
                    placeholder="e.g. 24"
                  />
                </div>

                <div>
                  <Label htmlFor="autoStrategy" className="mb-2">Strategy</Label>
                  <Textarea
                    id="autoStrategy"
                    name="autoStrategy"
                    value={(formData as { autoStrategy?: string }).autoStrategy || ""}
                    onChange={handleChange}
                    placeholder="e.g. balance then score"
                  />
                </div>
              </div>
            )}
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
      <div className="fixed bottom-4 right-4">
        <ModeToggle />
    	</div>
    </div>
  );
}
