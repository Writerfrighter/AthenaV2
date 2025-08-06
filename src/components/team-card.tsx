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
import { TeamInfoImages } from "@/app/dashboard/teamlist/page";
import Image from "next/image";
import TeamCarousel from "./image-carousel";
interface TeamCardProps {
  team: TeamInfoImages;
}
export function TeamCard({ team }: TeamCardProps) {
  return (
    <Card className="max-w-sm w-full mx-auto">
      <CardHeader>
        <CardTitle>{team.nickname}</CardTitle>
        <CardDescription>
          {"Team " +
            String(team.team_number) +
            ", from " +
            team.city +
            ", " +
            team.state_prov}
        </CardDescription>
        {/* <CardAction>Card Action</CardAction> */}
      </CardHeader>
      <CardContent className="flex-1">
        {team.images.length > 1 ? (
          <TeamCarousel images={team.images} />
        ) : (
          <div
            style={{
              position: "relative",
              height: "150px",
              width: "auto",
              maxWidth: "100%", // optional: don't overflow parent
            }}
          >
            <Image
              src={
                team.images.length ? team.images[0] : "/no-image-available.webp"
              }
              alt={`Team ${team.team_number}'s robot image.`}
              fill
              className="object-contain rounded-md"
              loading="lazy"
              sizes="(max-width: 640px) 100vw,
                    (max-width: 1024px) 50vw,
                    (max-width: 1280px) 33vw,
                    25vw"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button asChild>
          <Link
            href={"/dashboard/team/" + String(team.team_number)}
            className="w-full"
            target="_blank"
          >
            Scouting Page
          </Link>
        </Button>
        {team.website ? (
          <Button asChild variant="outline">
            <Link href={team.website} className="w-full">
              Website
            </Link>
          </Button>
        ) : (
          <Button variant="outline" disabled className="w-full">
            Website
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
