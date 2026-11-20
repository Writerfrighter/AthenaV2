"use client";

import { ConfigurableTeamPage } from "@/components/team-pages/configurable-team-page";

interface TeamPageClientProps {
  teamNumber: string;
}

export default function TeamPageClient({ teamNumber }: TeamPageClientProps) {
  return <ConfigurableTeamPage teamNumber={teamNumber} />;
}
