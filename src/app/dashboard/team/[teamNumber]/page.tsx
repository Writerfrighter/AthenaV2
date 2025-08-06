import Layout from "../../layout";

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

  return (
      <div>
        <h1>Scouting Info for Team {teamNumber}</h1>
      </div>
  );
}
