import { NextRequest, NextResponse } from 'next/server';
import { DatabaseManager } from '@/db/database-manager';
import { CompetitionType } from '@/db/types';
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
    console.log('Stats API: Starting request processing');
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const eventCode = searchParams.get('eventCode') || undefined;
    const competitionType = (searchParams.get('competitionType') as CompetitionType) || 'FRC';

    console.log('Stats API: Parameters -', { year, eventCode, competitionType });

    const service = getDbService();
    console.log('Stats API: Database service retrieved');

    // Get all entries for the year and competition type
    console.log('Stats API: Fetching pit entries...');
    const pitEntries = await service.getAllPitEntries(year, eventCode, competitionType);
    console.log('Stats API: Pit entries count:', pitEntries.length);
    
    console.log('Stats API: Fetching match entries...');
    const matchEntries = await service.getAllMatchEntries(year, eventCode, competitionType);
    console.log('Stats API: Match entries count:', matchEntries.length);  
    // Calculate statistics
    const uniqueTeams = new Set([
      ...pitEntries.map(entry => entry.teamNumber),
      ...matchEntries.map(entry => entry.teamNumber)
    ]);
    const uniqueMatches = new Set(matchEntries.map(entry => entry.matchNumber)).size;
    const totalMatches = matchEntries.length;
    const totalPitScouts = pitEntries.length;
    const uniqueTeamCount = uniqueTeams.size;

    // Calculate match completion (6 or 4 teams per match)
    const teamsPerMatch = competitionType === 'FRC' ? 6 : 4;
    const matchCompletion = uniqueMatches > 0 ? (totalMatches / (uniqueMatches * teamsPerMatch)) * 100 : 0;
    // console.log(matchEntries);
    // Calculate EPA-like metrics using proper EPA calculation
    const teamStats = Array.from(uniqueTeams).map(teamNumber => {
      const teamMatches = matchEntries.filter(entry => entry.teamNumber === teamNumber);
      const teamPit = pitEntries.find(entry => entry.teamNumber === teamNumber);

      // let avgEPA = 0;
      let totalEPA = 0;

      if (teamMatches.length > 0 && year && gameConfig[competitionType] && gameConfig[competitionType][year.toString()]) {
        try {
          const yearConfig = gameConfig[competitionType][year.toString()];
          const epaBreakdown = calculateEPA(teamMatches, year, yearConfig);
          // avgEPA = epaBreakdown.totalEPA;
          totalEPA = epaBreakdown.totalEPA;
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
          totalEPA = teamMatches.length > 0 ? totalEPA : 0;
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
        totalEPA = teamMatches.length > 0 ? totalEPA : 0;
      }

      return {
        teamNumber,
        name: teamPit?.name || `Team ${teamNumber}`,
        matchesPlayed: teamMatches.length,
        // avgEPA: isNaN(avgEPA) ? 0 : avgEPA,
        totalEPA: isNaN(totalEPA) ? 0 : totalEPA
      };
    });

    // Sort by EPA for ranking
    teamStats.sort((a, b) => b.totalEPA - a.totalEPA);

    const stats = {
      totalTeams: uniqueTeamCount,
      uniqueMatches,
      totalMatches,
      totalPitScouts,
      matchCompletion: Math.round(matchCompletion),
      teamStats: teamStats,
      recentActivity: matchEntries
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
