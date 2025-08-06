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
  {
    id: "1678",
    name: "Citrus Circuits",
    rank: 3,
    autoEPA: 29.5,
    teleopEPA: 40.8,
    endgameEPA: 14.1,
    totalEPA: 84.4,
  },
  {
    id: "2056",
    name: "OP Robotics",
    rank: 4,
    autoEPA: 27.9,
    teleopEPA: 42.3,
    endgameEPA: 13.0,
    totalEPA: 83.2,
  },
  {
    id: "111",
    name: "WildStang",
    rank: 5,
    autoEPA: 25.4,
    teleopEPA: 38.9,
    endgameEPA: 13.5,
    totalEPA: 77.8,
  },
  {
    id: "987",
    name: "High Rollers",
    rank: 6,
    autoEPA: 28.2,
    teleopEPA: 36.4,
    endgameEPA: 12.7,
    totalEPA: 77.3,
  },
  {
    id: "1986",
    name: "Team Titanium",
    rank: 7,
    autoEPA: 26.7,
    teleopEPA: 37.1,
    endgameEPA: 12.3,
    totalEPA: 76.1,
  },
  {
    id: "16",
    name: "Baxter Bomb Squad",
    rank: 8,
    autoEPA: 24.8,
    teleopEPA: 36.5,
    endgameEPA: 13.0,
    totalEPA: 74.3,
  },
  {
    id: "148",
    name: "Robowranglers",
    rank: 9,
    autoEPA: 23.9,
    teleopEPA: 35.2,
    endgameEPA: 13.4,
    totalEPA: 72.5,
  },
  {
    id: "33",
    name: "Killer Bees",
    rank: 10,
    autoEPA: 22.7,
    teleopEPA: 34.6,
    endgameEPA: 12.2,
    totalEPA: 69.5,
  },
  {
    id: "118",
    name: "Robonauts",
    rank: 11,
    autoEPA: 21.5,
    teleopEPA: 33.8,
    endgameEPA: 13.1,
    totalEPA: 68.4,
  },
  {
    id: "2481",
    name: "Roboteers",
    rank: 12,
    autoEPA: 20.9,
    teleopEPA: 32.7,
    endgameEPA: 12.9,
    totalEPA: 66.5,
  },
  {
    id: "195",
    name: "CyberKnights",
    rank: 13,
    autoEPA: 20.2,
    teleopEPA: 31.3,
    endgameEPA: 12.4,
    totalEPA: 63.9,
  },
  {
    id: "1241",
    name: "Theory 6",
    rank: 14,
    autoEPA: 19.7,
    teleopEPA: 30.6,
    endgameEPA: 12.6,
    totalEPA: 62.9,
  },
  {
    id: "610",
    name: "Crescent Coyotes",
    rank: 15,
    autoEPA: 19.1,
    teleopEPA: 29.8,
    endgameEPA: 12.1,
    totalEPA: 61.0,
  },
  {
    id: "3476",
    name: "Code Orange",
    rank: 16,
    autoEPA: 18.6,
    teleopEPA: 28.9,
    endgameEPA: 11.9,
    totalEPA: 59.4,
  },
  {
    id: "341",
    name: "Miss Daisy",
    rank: 17,
    autoEPA: 17.9,
    teleopEPA: 28.3,
    endgameEPA: 11.7,
    totalEPA: 57.9,
  },
  {
    id: "1717",
    name: "D'Penguineers",
    rank: 18,
    autoEPA: 17.3,
    teleopEPA: 27.4,
    endgameEPA: 11.5,
    totalEPA: 56.2,
  },
  {
    id: "2468",
    name: "Team Appreciate",
    rank: 19,
    autoEPA: 16.9,
    teleopEPA: 26.5,
    endgameEPA: 11.2,
    totalEPA: 54.6,
  },
  {
    id: "233",
    name: "Pink Team",
    rank: 20,
    autoEPA: 16.5,
    teleopEPA: 25.9,
    endgameEPA: 10.8,
    totalEPA: 53.2,
  },
  {
    id: "1310",
    name: "Runnymede Robotics",
    rank: 21,
    autoEPA: 16.0,
    teleopEPA: 25.1,
    endgameEPA: 10.5,
    totalEPA: 51.6,
  },
  {
    id: "1718",
    name: "The Fighting Pi",
    rank: 22,
    autoEPA: 15.5,
    teleopEPA: 24.4,
    endgameEPA: 10.2,
    totalEPA: 50.1,
  },
  {
    id: "5406",
    name: "Celt-X",
    rank: 23,
    autoEPA: 15.1,
    teleopEPA: 23.8,
    endgameEPA: 10.0,
    totalEPA: 48.9,
  },
  {
    id: "180",
    name: "SPAM",
    rank: 24,
    autoEPA: 14.7,
    teleopEPA: 23.2,
    endgameEPA: 9.8,
    totalEPA: 47.7,
  },
  {
    id: "364",
    name: "Team Fusion",
    rank: 25,
    autoEPA: 14.3,
    teleopEPA: 22.6,
    endgameEPA: 9.5,
    totalEPA: 46.4,
  },
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
          ghostClass=""
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
