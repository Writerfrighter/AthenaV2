import { NextRequest, NextResponse } from 'next/server';
import { DatabaseManager } from '@/db/database-manager';
import { calculateEPA } from '@/lib/statistics';
import gameConfigRaw from '../../../../../config/game-config.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const gameConfig = gameConfigRaw as any;

// Get database service from manager
function getDbService() {
  return DatabaseManager.getInstance().getService();
}

// GET /api/database/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const eventCode = searchParams.get('eventCode');

    const service = getDbService();

    // Get all entries for the year
    const pitEntries = await service.getAllPitEntries(year);
    const matchEntries = await service.getAllMatchEntries(year);

    // Filter by event if specified
    const filteredPitEntries = eventCode
      ? pitEntries.filter(entry => entry.eventCode === eventCode)
      : pitEntries;
    const filteredMatchEntries = eventCode
      ? matchEntries.filter(entry => entry.eventCode === eventCode)
      : matchEntries;

    // Calculate statistics
    const uniqueTeams = new Set([
      ...filteredPitEntries.map(entry => entry.teamNumber),
      ...filteredMatchEntries.map(entry => entry.teamNumber)
    ]);

    const totalMatches = filteredMatchEntries.length;
    const totalPitScouts = filteredPitEntries.length;
    const uniqueTeamCount = uniqueTeams.size;

    // Calculate match completion (assuming 6 matches per team per event)
    const matchesPerTeam = 6;
    const expectedMatches = uniqueTeamCount * matchesPerTeam;
    const matchCompletion = expectedMatches > 0 ? (totalMatches / expectedMatches) * 100 : 0;

    // Calculate EPA-like metrics using proper EPA calculation
    const teamStats = Array.from(uniqueTeams).map(teamNumber => {
      const teamMatches = filteredMatchEntries.filter(entry => entry.teamNumber === teamNumber);
      const teamPit = filteredPitEntries.find(entry => entry.teamNumber === teamNumber);

      let avgEPA = 0;
      let totalEPA = 0;

      if (teamMatches.length > 0 && year && gameConfig[year.toString()]) {
        try {
          const yearConfig = gameConfig[year.toString() as keyof typeof gameConfig];
          const epaBreakdown = calculateEPA(teamMatches, year, yearConfig);
          avgEPA = epaBreakdown.totalEPA;
          totalEPA = epaBreakdown.totalEPA * teamMatches.length;
        } catch (error) {
          console.error(`Error calculating EPA for team ${teamNumber}:`, error);
          // Fallback to simple calculation
          teamMatches.forEach(match => {
            if (match.gameSpecificData) {
              Object.values(match.gameSpecificData).forEach(value => {
                if (typeof value === 'number') {
                  totalEPA += value;
                }
              });
            }
          });
          avgEPA = teamMatches.length > 0 ? totalEPA / teamMatches.length : 0;
        }
      } else {
        // Fallback to simple calculation if no year config
        teamMatches.forEach(match => {
          if (match.gameSpecificData) {
            Object.values(match.gameSpecificData).forEach(value => {
              if (typeof value === 'number') {
                totalEPA += value;
              }
            });
          }
        });
        avgEPA = teamMatches.length > 0 ? totalEPA / teamMatches.length : 0;
      }

      return {
        teamNumber,
        name: teamPit?.name || `Team ${teamNumber}`,
        matchesPlayed: teamMatches.length,
        avgEPA: isNaN(avgEPA) ? 0 : avgEPA,
        totalEPA: isNaN(totalEPA) ? 0 : totalEPA
      };
    });

    // Sort by EPA for ranking
    teamStats.sort((a, b) => b.avgEPA - a.avgEPA);

    const stats = {
      totalTeams: uniqueTeamCount,
      totalMatches,
      totalPitScouts,
      matchCompletion: Math.round(matchCompletion),
      topTeams: teamStats.slice(0, 10),
      recentActivity: filteredMatchEntries
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5)
        .map(entry => ({
          teamNumber: entry.teamNumber,
          matchNumber: entry.matchNumber,
          timestamp: entry.timestamp
        }))
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
