import { NextRequest, NextResponse } from 'next/server';
import { DatabaseManager } from '@/db/database-manager';
import { CompetitionType } from '@/db/types';
import { calculateEPA } from '@/lib/statistics';
import gameConfigRaw from '../../../../../config/game-config.json';
import { auth } from '@/lib/auth/config';
import { hasPermission, PERMISSIONS } from '@/lib/auth/roles';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const gameConfig = gameConfigRaw as any;

// Get database service from manager
function getDbService() {
  return DatabaseManager.getInstance().getService();
}

// GET /api/database/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.role || !hasPermission(session.user.role, PERMISSIONS.VIEW_DASHBOARD)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
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
    
    // Calculate statistics in a single pass to improve performance
    const teamDataMap = new Map<number, { 
      name: string; 
      matchesPlayed: number; 
      matches: typeof matchEntries; 
    }>();
    
    const uniqueMatches = new Set<number>();
    
    // Single pass through match entries
    for (const entry of matchEntries) {
      uniqueMatches.add(entry.matchNumber);
      const teamData = teamDataMap.get(entry.teamNumber);
      if (teamData) {
        teamData.matchesPlayed++;
        teamData.matches.push(entry);
      } else {
        teamDataMap.set(entry.teamNumber, {
          name: `Team ${entry.teamNumber}`,
          matchesPlayed: 1,
          matches: [entry]
        });
      }
    }
    
    // Add teams from pit entries that don't have match data
    for (const pit of pitEntries) {
      if (!teamDataMap.has(pit.teamNumber)) {
        teamDataMap.set(pit.teamNumber, {
          name: `Team ${pit.teamNumber}`,
          matchesPlayed: 0,
          matches: []
        });
      }
    }

    const uniqueTeamCount = teamDataMap.size;
    const totalMatches = matchEntries.length;
    const totalPitScouts = pitEntries.length;

    // Calculate match completion (6 or 4 teams per match)
    const teamsPerMatch = competitionType === 'FRC' ? 6 : 4;
    const matchCompletion = uniqueMatches.size > 0 ? (totalMatches / (uniqueMatches.size * teamsPerMatch)) * 100 : 0;
    
    // Calculate EPA for teams with matches - more efficient batching
    const teamStats: Array<{ teamNumber: number; name: string; matchesPlayed: number; totalEPA: number }> = [];
    
    for (const [teamNumber, teamData] of teamDataMap.entries()) {
      let totalEPA = 0;

      if (teamData.matchesPlayed > 0 && year && gameConfig[competitionType] && gameConfig[competitionType][year.toString()]) {
        try {
          const yearConfig = gameConfig[competitionType][year.toString()];
          const epaBreakdown = calculateEPA(teamData.matches, year, yearConfig);
          totalEPA = epaBreakdown.totalEPA;
        } catch (error) {
          console.error(`Error calculating EPA for team ${teamNumber}:`, error);
          // Fallback to simple calculation
          for (const match of teamData.matches) {
            if (match.gameSpecificData) {
              for (const value of Object.values(match.gameSpecificData)) {
                if (typeof value === 'number') {
                  totalEPA += value;
                }
              }
            }
          }
        }
      } else if (teamData.matchesPlayed > 0) {
        // Fallback to simple calculation if no year config
        for (const match of teamData.matches) {
          if (match.gameSpecificData) {
            for (const value of Object.values(match.gameSpecificData)) {
              if (typeof value === 'number') {
                totalEPA += value;
              }
            }
          }
        }
      }

      teamStats.push({
        teamNumber,
        name: teamData.name,
        matchesPlayed: teamData.matchesPlayed,
        totalEPA: isNaN(totalEPA) ? 0 : totalEPA
      });
    }

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
