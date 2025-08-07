"use client";
import React, { useState } from "react";
import {
  Card,
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
import { WifiOff, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

type FormData = {
  team: string;
  name: string;
  drivetrain: string;
  weight: string;
  length: string;
  width: string;
  hasAuto: boolean;
  notes: string;
  autoDistance?: string;
  autoStrategy?: string;
};

const formDefault: FormData = {
  team: "",
  name: "",
  drivetrain: "",
  weight: "",
  length: "",
  width: "",
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

  const handleToggleAuto = (checked: boolean) => {
    setFormData((f) => ({ ...f, hasAuto: checked }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Scouting Data:", formData);

    const entryToSave = {
      teamNumber: Number(formData.team),
      name: formData.name,
      drivetrain: formData.drivetrain,
      weight: Number(formData.weight),
      length: Number(formData.length),
      width: Number(formData.width),
      ...Object.fromEntries(
        Object.entries(formData).filter(([key]) => key !== "team")
      ),
    };

    db.pitEntries
      .add(entryToSave)
      .then(() => {
        toast("Scouting data saved!", {
          description: `Team ${formData.team} entry stored locally.`
        });
        setFormData(formDefault);
      })
      .catch((error) => {
        toast("Failed to save data", {description: error.message});
      });
  };

  const registerServiceWorker = () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => 
          toast("Offline access enabled! 📦", {
            description:"You can now load this page without access to WiFi."
          }))
        .catch((err) =>
          console.error("Service Worker registration failed:", err)
        );
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background">
      {/* Header Bar */}
      <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Home
              </Button>
            </Link>
            <div className="h-6 w-px bg-border"></div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Pit Scouting</h1>
          </div>
          <ModeToggle />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Offline Capabilities Notice */}
        <Card className="shadow-sm">
          <CardContent className="">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <WifiOff className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-primary/90 dark:text-primary">Offline Ready</p>
                <p className="text-sm text-muted-foreground/80">
                  Data is saved locally and will automatically sync when you&apos;re back online
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Form */}
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Team Information */}
              <div className="space-y-6">
                <div className="border-b pb-4">
                  <h2 className="text-xl font-semibold mb-4">
                    Team Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="team" className="text-base font-medium">
                        Team Number
                      </Label>
                      <Input
                        name="team"
                        type="number"
                        value={formData.team}
                        onChange={handleChange}
                        placeholder="492"
                        required
                        className="h-12 text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-base font-medium">
                        Team Name
                      </Label>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Titan Robotics Club"
                        required
                        className="h-12 text-base"
                      />
                    </div>
                  </div>
                </div>

                {/* Drivetrain */}
                <div className="space-y-4">
                  <Label htmlFor="drivetrain" className="text-base font-medium">
                    Drivetrain Type
                  </Label>
                  <Select name="drivetrain">
                    <SelectTrigger className="h-12 text-base">
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

                {/* Robot Specifications */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold mb-4">
                    Robot Specifications
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="length" className="text-base font-medium">
                        Length (inches)
                      </Label>
                      <Input
                        name="length"
                        type="number"
                        value={formData.length}
                        onChange={handleChange}
                        placeholder="30"
                        required
                        className="h-12 text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="width" className="text-base font-medium">
                        Width (inches)
                      </Label>
                      <Input
                        name="width"
                        type="number"
                        value={formData.width}
                        onChange={handleChange}
                        placeholder="30"
                        required
                        className="h-12 text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight" className="text-base font-medium">
                        Weight (lbs)
                      </Label>
                      <Input
                        name="weight"
                        type="number"
                        value={formData.weight}
                        onChange={handleChange}
                        placeholder="125"
                        required
                        className="h-12 text-base"
                      />
                    </div>
                  </div>
                </div>

                {/* Autonomous Capabilities */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Switch
                      id="hasAuto"
                      checked={formData.hasAuto}
                      onCheckedChange={handleToggleAuto}
                      className="scale-125"
                    />
                    <Label htmlFor="hasAuto" className="text-base font-medium cursor-pointer">
                      Has Autonomous Capabilities
                    </Label>
                  </div>

                  {formData.hasAuto && (
                    <div className="space-y-6 bg-muted/30 p-6 rounded-lg border shadow-sm">
                      <h3 className="text-lg font-semibold">
                        Autonomous Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="autoDistance" className="text-base font-medium">
                            Auto Reach (inches)
                          </Label>
                          <Input
                            id="autoDistance"
                            name="autoDistance"
                            type="number"
                            value={formData.autoDistance || ""}
                            onChange={handleChange}
                            placeholder="e.g. 24"
                            className="h-12 text-base"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="autoStrategy" className="text-base font-medium">
                            Autonomous Strategy
                          </Label>
                          <Textarea
                            id="autoStrategy"
                            name="autoStrategy"
                            value={formData.autoStrategy || ""}
                            onChange={handleChange}
                            placeholder="e.g. balance then score"
                            className="min-h-[3rem]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-4">
                  <Label htmlFor="notes" className="text-base font-medium">
                    Additional Notes
                  </Label>
                  <Textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Any additional observations about this team..."
                    className="min-h-[4rem]"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full h-12 text-base"
                  >
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Save Scouting Data
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              onClick={registerServiceWorker}
              className="w-full"
            >
              Enable Offline Mode 🔄
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
