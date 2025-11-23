"use client";

import { useState, useEffect } from "react";
import { ReactSortable } from "react-sortablejs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { GripVertical, Trophy, TrendingUp } from "lucide-react";
import { usePicklistData } from "@/hooks/use-picklist-data";

export default function SortablePicklist() {
  const { teams: picklistTeams, loading } = usePicklistData();
  const [teams, setTeams] = useState(picklistTeams);

  // Update local state when picklist data changes
  useEffect(() => {
    setTeams(picklistTeams);
  }, [picklistTeams]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Picklist</h1>
        <p className="text-muted-foreground">
          Drag and drop teams to reorder your alliance selection preferences. Teams are ranked by Total EPA.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Teams Listed</p>
                <p className="text-2xl font-bold">{loading ? "..." : teams.length}</p>
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top Team EPA</p>
                <p className="text-2xl font-bold">{loading ? "..." : teams.length > 0 ? Math.max(...teams.map(t => t.totalEPA)).toFixed(3) : "0"}</p>
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <Trophy className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average EPA</p>
                <p className="text-2xl font-bold">
                  {loading ? "..." : teams.length > 0 ? (teams.reduce((sum, t) => sum + t.totalEPA, 0) / teams.length).toFixed(3) : "0"}
                </p>
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sortable Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rankings</CardTitle>
          <CardDescription>
            Drag teams using the handle to reorder your preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead className="text-center">Auto EPA</TableHead>
                  <TableHead className="text-center">Teleop EPA</TableHead>
                  <TableHead className="text-center">Endgame EPA</TableHead>
                  <TableHead className="text-center font-semibold">Total EPA</TableHead>
                </TableRow>
              </TableHeader>

              {/* ReactSortable handles the sorting logic and updates state */}
              <ReactSortable
                tag="tbody"
                list={teams}
                setList={setTeams}
                animation={200}
                ghostClass="opacity-50"
                handle=".drag-handle"
              >
                {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading team data...
                  </TableCell>
                </TableRow>
              ) : teams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No team data available
                  </TableCell>
                </TableRow>
              ) : (
                teams.map((team, index) => (
                  <TableRow 
                    key={team.id} 
                    className="hover:bg-muted/50"
                  >
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move drag-handle" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className="font-mono"
                          >
                            {team.id}
                          </Badge>
                          {index < 3 && (
                            <Badge variant="default">
                              {index === 0 ? '1st' : index === 1 ? '2nd' : '3rd'}
                            </Badge>
                          )}
                        </div>
                        <span className="font-medium">{team.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        #{team.rank}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-mono">{team.autoEPA}</TableCell>
                    <TableCell className="text-center font-mono">{team.teleopEPA}</TableCell>
                    <TableCell className="text-center font-mono">{team.endgameEPA}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="default" className="font-mono">
                        {team.totalEPA}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
              </ReactSortable>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
