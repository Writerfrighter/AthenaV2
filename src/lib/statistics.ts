import { MatchEntry } from '../db/db';
import { YearConfig } from '../hooks/use-game-config';

export interface TeamStats {
  totalMatches: number;
  avgScore: number;
  epa: number;
  autoStats: Record<string, number>;
  teleopStats: Record<string, number>;
  endgameStats: Record<string, number>;
}

export interface EPABreakdown {
  autoEPA: number;
  teleopEPA: number;
  endgameEPA: number;
  totalEPA: number;
}

/**
 * Calculate Expected Points Added (EPA) for a team based on their match performance
 * EPA represents how many points a team contributes above average
 */
export function calculateEPA(matches: MatchEntry[], year: number, config: YearConfig): EPABreakdown {
  if (matches.length === 0) {
    return { autoEPA: 0, teleopEPA: 0, endgameEPA: 0, totalEPA: 0 };
  }

  let totalAutoPoints = 0;
  let totalTeleopPoints = 0;
  let totalEndgamePoints = 0;

  for (const match of matches) {
    const autoPoints = calculatePeriodPoints((match.gameSpecificData?.autonomous as Record<string, number | string | boolean>) || {}, config.scoring.autonomous);
    const teleopPoints = calculatePeriodPoints((match.gameSpecificData?.teleop as Record<string, number | string | boolean>) || {}, config.scoring.teleop);
    const endgamePoints = calculatePeriodPoints((match.gameSpecificData?.endgame as Record<string, number | string | boolean>) || {}, config.scoring.endgame);

    totalAutoPoints += autoPoints;
    totalTeleopPoints += teleopPoints;
    totalEndgamePoints += endgamePoints;
  }

  const matchCount = matches.length;
  const autoEPA = totalAutoPoints / matchCount;
  const teleopEPA = totalTeleopPoints / matchCount;
  const endgameEPA = totalEndgamePoints / matchCount;
  const totalEPA = autoEPA + teleopEPA + endgameEPA;

  return { autoEPA, teleopEPA, endgameEPA, totalEPA };
}


/**
 * Calculate points for a period (autonomous, teleop, endgame) using config
 */
function calculatePeriodPoints(periodData: Record<string, number | string | boolean>, periodConfig: Record<string, any>): number {
  let points = 0;
  for (const [key, value] of Object.entries(periodData)) {
    // Find config key case-insensitively
    const configKey = Object.keys(periodConfig).find(k => k.toLowerCase() === key.toLowerCase());
    if (!configKey) continue;
    const scoringDef = periodConfig[configKey];
    if (typeof value === 'number') {
      points += value * (scoringDef.points || 0);
    } else if (typeof value === 'boolean' && value) {
      points += scoringDef.points || 0;
    } else if (typeof value === 'string') {
      // For enum/string values, try to match config subkeys (e.g., climb: 'onstage')
      if (scoringDef[value]) {
        points += scoringDef[value].points || 0;
      } else if (scoringDef.points) {
        // fallback: treat as boolean if config has points
        points += scoringDef.points;
      }
    }
  }
  return points;
}

/**
 * Calculate comprehensive team statistics
 */
export function calculateTeamStats(matches: MatchEntry[], year: number, config: YearConfig): TeamStats {
  if (matches.length === 0) {
    return {
      totalMatches: 0,
      avgScore: 0,
      epa: 0,
      autoStats: {},
      teleopStats: {},
      endgameStats: {}
    };
  }

  const epaBreakdown = calculateEPA(matches, year, config);
  const autoStats = calculatePeriodAverages(matches, 'autonomous');
  const teleopStats = calculatePeriodAverages(matches, 'teleop');
  const endgameStats = calculatePeriodAverages(matches, 'endgame');

  return {
    totalMatches: matches.length,
    avgScore: epaBreakdown.totalEPA,
    epa: epaBreakdown.totalEPA,
    autoStats,
    teleopStats,
    endgameStats
  };
}

/**
 * Calculate averages for a specific period across all matches
 */
function calculatePeriodAverages(matches: MatchEntry[], period: string): Record<string, number> {
  const totals: Record<string, number> = {};
  const counts: Record<string, number> = {};

  for (const match of matches) {
    const periodData = match.gameSpecificData?.[period] || {};
    
    for (const [action, value] of Object.entries(periodData)) {
      if (typeof value === 'number') {
        totals[action] = (totals[action] || 0) + value;
        counts[action] = (counts[action] || 0) + 1;
      }
    }
  }

  const averages: Record<string, number> = {};
  for (const action in totals) {
    averages[action] = counts[action] > 0 ? totals[action] / counts[action] : 0;
  }

  return averages;
}

/**
 * Calculate team rankings based on EPA
 */
export function calculateTeamRankings(allMatches: MatchEntry[], year: number, config: YearConfig): Array<{teamNumber: string, epa: number, rank: number}> {
  // Group matches by team
  const teamMatches = new Map<string, MatchEntry[]>();
  for (const match of allMatches) {
    if (!teamMatches.has(match.teamNumber)) {
      teamMatches.set(match.teamNumber, []);
    }
    teamMatches.get(match.teamNumber)!.push(match);
  }

  // Calculate EPA for each team
  const teamEPAs = Array.from(teamMatches.entries()).map(([teamNumber, matches]) => {
  const epa = calculateEPA(matches, year, config);
    return { teamNumber, epa: epa.totalEPA, matches: matches.length };
  });

  // Sort by EPA (descending) and assign ranks
  teamEPAs.sort((a, b) => b.epa - a.epa);
  return teamEPAs.map((team, index) => ({
    teamNumber: team.teamNumber,
    epa: team.epa,
    rank: index + 1
  }));
}

/**
 * Get percentile ranking for a team
 */
export function getTeamPercentile(teamNumber: string, allMatches: MatchEntry[], year: number, config: YearConfig): number {
  const rankings = calculateTeamRankings(allMatches, year, config);
  const teamRank = rankings.find(r => r.teamNumber === teamNumber);
  if (!teamRank) return 0;
  return Math.round((1 - (teamRank.rank - 1) / rankings.length) * 100);
}

/**
 * Format numbers for display with appropriate precision
 */
export function formatStat(value: number, decimals: number = 1): string {
  return value.toFixed(decimals);
}

/**
 * Calculate consistency score (lower is more consistent)
 */
export function calculateConsistency(matches: MatchEntry[], year: number, config: YearConfig): number {
  if (matches.length < 2) return 0;
  const epas = matches.map(match => {
    const singleMatchEPA = calculateEPA([match], year, config);
    return singleMatchEPA.totalEPA;
  });
  const mean = epas.reduce((sum, epa) => sum + epa, 0) / epas.length;
  const variance = epas.reduce((sum, epa) => sum + Math.pow(epa - mean, 2), 0) / epas.length;
  const standardDeviation = Math.sqrt(variance);
  // Return coefficient of variation (CV) as consistency score
  return mean !== 0 ? standardDeviation / Math.abs(mean) : 0;
}
