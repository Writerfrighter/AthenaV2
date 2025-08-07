import TeamPageClient from "./team-page-client";

export async function generateStaticParams() {
  // Example team numbers to pre-render
  const teamNumbers = [492];

  return teamNumbers.map((number) => ({
    teamNumber: number.toString(),
  }));
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ teamNumber: string }>;
}) {
  const { teamNumber } = await params;

  return <TeamPageClient teamNumber={teamNumber} />;
}
