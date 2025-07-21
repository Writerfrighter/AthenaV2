"use client";

import { useState } from "react";
import { ReactSortable } from "react-sortablejs";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

const initialTeams = [
  {
    id: "492",
    name: "Titan Robotics",
    rank: 1,
    autoEPA: 35.4,
    teleopEPA: 42.1,
    endgameEPA: 12.8,
    totalEPA: 90.3,
  },
  {
    id: "254",
    name: "Cheesy Poofs",
    rank: 2,
    autoEPA: 30.2,
    teleopEPA: 39.7,
    endgameEPA: 11.4,
    totalEPA: 81.3,
  },
  // add more teams...
];

export default function SortablePicklist() {
  const [teams, setTeams] = useState(initialTeams);

  return (
    <div className="rounded-md border shadow-sm overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Team #</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Rank</TableHead>
            <TableHead>Auto EPA</TableHead>
            <TableHead>Teleop EPA</TableHead>
            <TableHead>Endgame EPA</TableHead>
            <TableHead>Total EPA</TableHead>
          </TableRow>
        </TableHeader>

        {/* ReactSortable handles the sorting logic and updates state */}
        <ReactSortable
          tag="tbody"
          list={teams}
          setList={setTeams}
          animation={200}
          ghostClass="bg-muted text-muted-foreground"
        >
          {teams.map((team) => (
            <TableRow key={team.id} className="cursor-move">
              <TableCell>{team.id}</TableCell>
              <TableCell>{team.name}</TableCell>
              <TableCell>{team.rank}</TableCell>
              <TableCell>{team.autoEPA}</TableCell>
              <TableCell>{team.teleopEPA}</TableCell>
              <TableCell>{team.endgameEPA}</TableCell>
              <TableCell className="font-semibold">{team.totalEPA}</TableCell>
            </TableRow>
          ))}
        </ReactSortable>
      </Table>
    </div>
  );
}
