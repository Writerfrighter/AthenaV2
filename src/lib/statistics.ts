import { MatchEntry } from '../db/db';
import { GameConfig } from '../hooks/use-game-config';

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
export function calculateEPA(matches: MatchEntry[], year: number): EPABreakdown {
  if (matches.length === 0) {
    return { autoEPA: 0, teleopEPA: 0, endgameEPA: 0, totalEPA: 0 };
  }

  let totalAutoPoints = 0;
  let totalTeleopPoints = 0;
  let totalEndgamePoints = 0;

  for (const match of matches) {
    const autoPoints = calculateAutonomousPoints((match.gameSpecificData?.autonomous as unknown as Record<string, number | string | boolean>) || {}, year);
    const teleopPoints = calculateTeleopPoints((match.gameSpecificData?.teleop as unknown as Record<string, number | string | boolean>) || {}, year);
    const endgamePoints = calculateEndgamePoints((match.gameSpecificData?.endgame as unknown as Record<string, number | string | boolean>) || {}, year);

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
 * Calculate autonomous points based on year and scoring data
 */
function calculateAutonomousPoints(autoData: Record<string, number | string | boolean>, year: number): number {
  let points = 0;

  switch (year) {
    case 2025: // REEFSCAPE
      points += (Number(autoData.l2) || 0) * 4;
      points += (Number(autoData.l3) || 0) * 6;
      points += (Number(autoData.l4) || 0) * 10;
      points += (Number(autoData.net) || 0) * 3;
      points += (Number(autoData.processor) || 0) * 3;
      points += autoData.mobility ? 3 : 0;
      break;
    case 2024: // CRESCENDO
      points += (Number(autoData.speaker) || 0) * 5;
      points += (Number(autoData.amp) || 0) * 2;
      points += autoData.mobility ? 2 : 0;
      break;
    case 2023: // CHARGED UP
      points += (Number(autoData.cones) || 0) * 6;
      points += (Number(autoData.cubes) || 0) * 4;
      points += autoData.mobility ? 3 : 0;
      points += autoData.docking ? 8 : 0;
      points += autoData.engagement ? 12 : 0;
      break;
    default:
      // Generic calculation - sum all numeric values
      Object.values(autoData).forEach(value => {
        if (typeof value === 'number') points += value;
      });
  }

  return points;
}

/**
 * Calculate teleop points based on year and scoring data
 */
function calculateTeleopPoints(teleopData: Record<string, number | string | boolean>, year: number): number {
  let points = 0;

  switch (year) {
    case 2025: // REEFSCAPE
      points += (Number(teleopData.l2) || 0) * 2;
      points += (Number(teleopData.l3) || 0) * 4;
      points += (Number(teleopData.l4) || 0) * 7;
      points += (Number(teleopData.net) || 0) * 2;
      points += (Number(teleopData.processor) || 0) * 1;
      break;
    case 2024: // CRESCENDO
      points += (Number(teleopData.speaker) || 0) * 2;
      points += (Number(teleopData.amp) || 0) * 1;
      points += (Number(teleopData.trap) || 0) * 5;
      break;
    case 2023: // CHARGED UP
      points += (Number(teleopData.cones) || 0) * 5;
      points += (Number(teleopData.cubes) || 0) * 3;
      break;
    default:
      // Generic calculation
      Object.values(teleopData).forEach(value => {
        if (typeof value === 'number') points += value;
      });
  }

  return points;
}

/**
 * Calculate endgame points based on year and scoring data
 */
function calculateEndgamePoints(endgameData: Record<string, number | string | boolean>, year: number): number {
  let points = 0;

  switch (year) {
    case 2025: // REEFSCAPE
      if (endgameData.barge === 'low') points += 2;
      else if (endgameData.barge === 'high') points += 6;
      if (endgameData.deep) points += 3;
      if (endgameData.shallow) points += 3;
      if (endgameData.net) points += 3;
      break;
    case 2024: // CRESCENDO
      if (endgameData.climb === 'park') points += 1;
      else if (endgameData.climb === 'onstage') points += 3;
      if (endgameData.harmony) points += 2;
      if (endgameData.spotlit) points += 1;
      break;
    case 2023: // CHARGED UP
      if (endgameData.climb === 'dock') points += 6;
      else if (endgameData.climb === 'engage') points += 10;
      if (endgameData.park) points += 2;
      break;
    default:
      // Generic calculation
      Object.values(endgameData).forEach(value => {
        if (typeof value === 'number') points += value;
      });
  }

  return points;
}

/**
 * Calculate comprehensive team statistics
 */
export function calculateTeamStats(matches: MatchEntry[], year: number): TeamStats {
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

  const epaBreakdown = calculateEPA(matches, year);
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
export function calculateTeamRankings(allMatches: MatchEntry[], year: number): Array<{teamNumber: string, epa: number, rank: number}> {
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
    const epa = calculateEPA(matches, year);
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
export function getTeamPercentile(teamNumber: string, allMatches: MatchEntry[], year: number): number {
  const rankings = calculateTeamRankings(allMatches, year);
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
export function calculateConsistency(matches: MatchEntry[], year: number): number {
  if (matches.length < 2) return 0;

  const epas = matches.map(match => {
    const singleMatchEPA = calculateEPA([match], year);
    return singleMatchEPA.totalEPA;
  });

  const mean = epas.reduce((sum, epa) => sum + epa, 0) / epas.length;
  const variance = epas.reduce((sum, epa) => sum + Math.pow(epa - mean, 2), 0) / epas.length;
  const standardDeviation = Math.sqrt(variance);

  // Return coefficient of variation (CV) as consistency score
  return mean !== 0 ? standardDeviation / Math.abs(mean) : 0;
}
