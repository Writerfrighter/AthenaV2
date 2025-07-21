import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Button } from "./ui/button";

export function TeamCard({
  team,
}: {
  team: {
    name: string;
    number: number;
    location: string;
    website?: string;
    img_url?: string;
  };
}) {
  return (
    <Card className="max-w-sm w-full mx-auto">
      <CardHeader>
        <CardTitle>{team.name}</CardTitle>
        <CardDescription>
          {"Team " + String(team.number) + ", from " + team.location}
        </CardDescription>
        {/* <CardAction>Card Action</CardAction> */}
      </CardHeader>
      <CardContent></CardContent>
      <CardFooter className="flex-col gap-2">
        <Button asChild>
          <Link
            href={"/dashboard/team/" + String(team.number)}
            className="w-full"
          >
            Scouting Page
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={team.website ? team.website : ""} className="w-full">
            Website
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
