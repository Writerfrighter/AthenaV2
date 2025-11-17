import { MatchEntry } from '../db/types';
import { YearConfig, ScoringDefinition } from './shared-types';
import type { TeamStats, EPABreakdown } from '../lib/shared-types';

// Cache for EPA calculations to avoid recalculating for the same teams
const epaCache = new Map<string, { result: EPABreakdown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(teamNumber: number, year: number, matchIds: string): string {
  return `${teamNumber}-${year}-${matchIds}`;
}

function getFromCache(key: string): EPABreakdown | null {
  const cached = epaCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }
  if (cached) {
    epaCache.delete(key); // Remove expired entry
  }
  return null;
}

function setInCache(key: string, result: EPABreakdown): void {
  epaCache.set(key, { result, timestamp: Date.now() });
  // Limit cache size to prevent memory issues
  if (epaCache.size > 1000) {
    const firstKey = epaCache.keys().next().value as string | undefined;
    if (firstKey) {
      epaCache.delete(firstKey);
    }
  }
}

/**
 * Calculate Expected Points Added (EPA) for a team based on their match performance
 * EPA represents how many points a team contributes on average
 */
export function calculateEPA(matches: MatchEntry[], year: number, config: YearConfig): EPABreakdown {
  if (matches.length === 0) {
    return { auto: 0, teleop: 0, endgame: 0, penalties: 0, totalEPA: 0 };
  }

  // Check cache if all matches are from the same team
  const teamNumbers = new Set(matches.map(m => m.teamNumber));
  if (teamNumbers.size === 1) {
    const teamNumber = matches[0].teamNumber;
    const matchIds = matches.map(m => m.id).sort().join(',');
    const cacheKey = getCacheKey(teamNumber, year, matchIds);
    
    const cached = getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const result = calculateEPAInternal(matches, year, config);
    setInCache(cacheKey, result);
    return result;
  }

  // For multiple teams, calculate without caching
  return calculateEPAInternal(matches, year, config);
}

function calculateEPAInternal(matches: MatchEntry[], year: number, config: YearConfig): EPABreakdown {
  let totalAutoPoints = 0;
  let totalTeleopPoints = 0;
  let totalEndgamePoints = 0;
  let totalPenaltiesPoints = 0;

  for (const match of matches) {
    const autoPoints = calculatePeriodPoints((match.gameSpecificData?.autonomous as Record<string, number | string | boolean>) || {}, config.scoring.autonomous);
    const teleopPoints = calculatePeriodPoints((match.gameSpecificData?.teleop as Record<string, number | string | boolean>) || {}, config.scoring.teleop);
    const endgamePoints = calculatePeriodPoints((match.gameSpecificData?.endgame as Record<string, number | string | boolean>) || {}, config.scoring.endgame);
    const penaltiesPoints = calculatePeriodPoints((match.gameSpecificData?.fouls as Record<string, number | string | boolean>) || {}, config.scoring.fouls || {});

    totalAutoPoints += autoPoints;
    totalTeleopPoints += teleopPoints;
    totalEndgamePoints += endgamePoints;
    totalPenaltiesPoints += penaltiesPoints;
  }

  const matchCount = matches.length;
  const auto = isNaN(totalAutoPoints / matchCount) ? 0 : totalAutoPoints / matchCount;
  const teleop = isNaN(totalTeleopPoints / matchCount) ? 0 : totalTeleopPoints / matchCount;
  const endgame = isNaN(totalEndgamePoints / matchCount) ? 0 : totalEndgamePoints / matchCount;
  const penalties = isNaN(totalPenaltiesPoints / matchCount) ? 0 : totalPenaltiesPoints / matchCount;
  const totalEPA = isNaN(auto + teleop + endgame + penalties) ? 0 : auto + teleop + endgame + penalties;

  return { auto, teleop, endgame, penalties, totalEPA };
}


/**
 * Calculate points for a period (autonomous, teleop, endgame) using config
 * 
 * Supports two scoring types:
 * 1. Simple scoring: { points: 5 } - awards 5 points for boolean true or multiplies by number
 * 2. Enum scoring: { pointValues: { "shallow": 3, "deep": 6, "none": 0 } } - awards based on string value
 * 
 * Example match data:
 * - climbing: "deep" -> awards 6 points (enum-based)
 * - mobility: true -> awards 3 points (simple boolean)
 * - speakerNotes: 4 -> awards 4 * 2 = 8 points (simple number multiplication)
 */
function calculatePeriodPoints(periodData: Record<string, number | string | boolean>, periodConfig: Record<string, ScoringDefinition>): number {
  let points = 0;
  for (const [key, value] of Object.entries(periodData)) {
    // Find config key case-insensitively
    const configKey = Object.keys(periodConfig).find(k => k.toLowerCase() === key.toLowerCase());
    if (!configKey) continue;
    const scoringDef = periodConfig[configKey];
    
    if (typeof value === 'number') {
      // For numeric values, multiply by points (simple scoring)
      const multiplier = scoringDef.points || 0;
      if (!isNaN(multiplier) && !isNaN(value)) {
        points += value * multiplier;
      }
    } else if (typeof value === 'boolean' && value) {
      // For boolean values, add points if true (simple scoring)
      const pts = scoringDef.points || 0;
      if (!isNaN(pts)) {
        points += pts;
      }
    } else if (typeof value === 'string' && value !== '' && value !== 'none') {
      // For string values, check if we have enum-based scoring first
      if (scoringDef.pointValues && scoringDef.pointValues[value] !== undefined) {
        const pts = scoringDef.pointValues[value];
        if (!isNaN(pts)) {
          points += pts;
        }
      } else if (scoringDef.points) {
        // Fallback to simple scoring for valid string values
        const pts = scoringDef.points;
        if (!isNaN(pts)) {
          points += pts;
        }
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
 * Optimized to use a single pass for grouping and sorting
 */
export function calculateTeamRankings(allMatches: MatchEntry[], year: number, config: YearConfig): Array<{teamNumber: number, epa: number, rank: number}> {
  // Group matches by team in a single pass
  const teamMatches = new Map<number, MatchEntry[]>();
  for (const match of allMatches) {
    const matches = teamMatches.get(match.teamNumber);
    if (matches) {
      matches.push(match);
    } else {
      teamMatches.set(match.teamNumber, [match]);
    }
  }

  // Calculate EPA for each team and create result array in one step
  const teamEPAs: Array<{teamNumber: number, epa: number, rank: number}> = [];
  for (const [teamNumber, matches] of teamMatches.entries()) {
    const epa = calculateEPA(matches, year, config);
    teamEPAs.push({ teamNumber, epa: epa.totalEPA, rank: 0 });
  }

  // Sort by EPA (descending) and assign ranks in place
  teamEPAs.sort((a, b) => b.epa - a.epa);
  for (let i = 0; i < teamEPAs.length; i++) {
    teamEPAs[i].rank = i + 1;
  }
  
  return teamEPAs;
}

/**
 * Get percentile ranking for a team
 */
export function getTeamPercentile(teamNumber: number, allMatches: MatchEntry[], year: number, config: YearConfig): number {
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
