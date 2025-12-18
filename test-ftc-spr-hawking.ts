/**
 * Test script for SPR (Scouter Performance Rating) on FTC Hawking League Tournament
 * 
 * This script validates the SPR algorithm using real FTC match data from USWAHALT event
 * with actual scouter userIds and official results from the FTC Events API.
 * 
 * USAGE:
 *   pnpm tsx test-ftc-spr-hawking.ts
 * 
 * WHAT IT TESTS:
 *   - Fetches match entries from local dev server (http://localhost:3000)
 *   - Fetches official results from FTC Events API
 *   - Runs SPR algorithm to rank scouter accuracy
 *   - Compares predicted vs official alliance scores
 * 
 * REQUIREMENTS:
 *   - Dev server must be running (pnpm dev)
 *   - FTC_API_KEY must be set in .env
 *   - Event USWAHALT must have match entries in database
 */

import { computeScouterAccuracy } from './src/lib/statistics';
import type { MatchEntry } from './src/db/types';
import { YearConfig } from './src/lib/shared-types';

const DEV_SERVER = 'http://localhost:3000';
const EVENT_CODE = 'USWAHALT'; // Hawking League Tournament
const SEASON = 2026; 
const COMPETITION_TYPE = 'FTC';

// FTC 2025-2026 DECODE game config
const decodeConfig: YearConfig = {
  competitionType: 'FTC',
  gameName: 'DECODE',
  startPositions: ['Far Zone', 'Goal'],
  pitScouting: {
    autonomous: {},
    teleoperated: {},
    endgame: {}
  },
  scoring: {
    autonomous: {
      leave: {
        label: 'Leave Starting Zone',
        points: 3,
        description: 'Robot leaves starting zone during autonomous',
        type: 'boolean'
      },
      artifacts_classified: {
        label: 'Artifacts Classified',
        points: 3,
        description: 'Artifacts classified during autonomous'
      },
      artifacts_overflow: {
        label: 'Artifacts Overflowed',
        points: 1,
        description: 'Artifacts placed overflowed during autonomous'
      },
      patterns: {
        label: 'Patterns Completed',
        points: 2,
        description: 'Patterns completed at the end of autonomous'
      }
    },
    teleop: {
      artifacts_classified: {
        label: 'Artifacts Classified',
        points: 3,
        description: 'Artifacts classified during teleop'
      },
      artifacts_overflow: {
        label: 'Artifacts Overflowed',
        points: 1,
        description: 'Artifacts placed overflowed during teleop'
      },
      artifacts_depot: {
        label: 'Artifacts in Depot',
        points: 1,
        description: 'Artifacts placed in depot during teleop'
      },
      patterns: {
        label: 'Patterns Completed',
        points: 2,
        description: 'Patterns completed at the end of teleop'
      }
    },
    endgame: {
      ending_based_state: {
        label: 'Ending Base State',
        description: "Robot's final base state during endgame",
        type: 'select',
        // options: ['none', 'partial', 'full'],
        pointValues: {
          none: 0,
          partial: 5,
          full: 10
        }
      }
    },
    fouls: {}
  }
};
/*
 * Fetch match entries from dev server
 */
async function fetchMatchEntries(): Promise<MatchEntry[]> {
  try {
    const url = `${DEV_SERVER}/api/database/match?eventCode=${EVENT_CODE}&competitionType=${COMPETITION_TYPE}`;
    console.log(`📡 Fetching match entries from: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`Server returned ${response.status}:`);
      console.error(text.substring(0, 500)); // Show first 500 chars
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const text = await response.text();
      console.error(`Expected JSON but got ${contentType}:`);
      console.error(text.substring(0, 500)); // Show first 500 chars
      throw new Error(`Server returned ${contentType} instead of JSON. Is the dev server running?`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Expected array of match entries');
    }
    
    // Filter to only entries with userIds (scouters we want to evaluate)
    const entriesWithScouters = data.filter((entry: MatchEntry) => 
      entry.userId && entry.userId.trim() !== ''
    );
    
    console.log(`✓ Fetched ${data.length} total entries, ${entriesWithScouters.length} with scouter IDs`);
    return entriesWithScouters;
    
  } catch (error) {
    console.error('❌ Failed to fetch match entries:', error);
    throw error;
  }
}

/**
 * Fetch official results from FTC Events API via dev server API route
 */
async function fetchOfficialResults(): Promise<Map<number, {
  red: { officialScore: number; foulPoints: number };
  blue: { officialScore: number; foulPoints: number };
}>> {
  try {
    const url = `${DEV_SERVER}/api/database/spr/official-results?eventCode=${EVENT_CODE}&competitionType=${COMPETITION_TYPE}&year=${SEASON}`;
    console.log(`📡 Fetching official results from: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`Server returned ${response.status}:`);
      console.error(text.substring(0, 500));
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const text = await response.text();
      console.error(`Expected JSON but got ${contentType}:`);
      console.error(text.substring(0, 500));
      throw new Error(`Server returned ${contentType} instead of JSON. Is the dev server running?`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    // Convert results object to Map
    const resultsMap = new Map();
    if (data.results && typeof data.results === 'object') {
      for (const [matchNum, scores] of Object.entries(data.results)) {
        resultsMap.set(parseInt(matchNum), scores);
      }
    }
    
    console.log(`✓ Fetched ${resultsMap.size} official match results`);
    return resultsMap;
    
  } catch (error) {
    console.error('❌ Failed to fetch official results:', error);
    throw error;
  }
}

/**
 * Run the test and display results
 */
async function runTest() {
  console.log('🧪 Testing SPR on FTC Hawking League Tournament (USWAHALT)\n');
  console.log('='.repeat(70));
  
  try {
    // Fetch data
    console.log('\n📊 Fetching data from dev server and FTC API...\n');
    const matches = await fetchMatchEntries();
    const officialResults = await fetchOfficialResults();
    
    if (matches.length === 0) {
      console.error('❌ No match entries found for event', EVENT_CODE);
      console.log('\nℹ️  Make sure:');
      console.log('   1. Dev server is running (pnpm dev)');
      console.log('   2. Event USWAHALT has match entries in the database');
      console.log('   3. Match entries have userId field populated');
      return;
    }
    
    if (officialResults.size === 0) {
      console.error('❌ No official results found for event', EVENT_CODE);
      console.log('\nℹ️  Make sure:');
      console.log('   1. FTC_API_KEY is set in .env');
      console.log('   2. Event has completed matches with posted scores');
      return;
    }
    
    // Display scouter distribution
    const scouterCounts = new Map<string, number>();
    matches.forEach(m => {
      if (m.userId) {
        scouterCounts.set(m.userId, (scouterCounts.get(m.userId) || 0) + 1);
      }
    });
    
    console.log('\n📋 Scouter Assignment Distribution:');
    scouterCounts.forEach((count, scouter) => {
      console.log(`   ${scouter}: ${count} matches`);
    });
    
    // Display match distribution
    const matchNumbers = new Set(matches.map(m => m.matchNumber));
    console.log(`\n📊 Match Coverage:`);
    console.log(`   Matches scouted: ${matchNumbers.size}`);
    console.log(`   Official results available: ${officialResults.size}`);
    console.log(`   Total match entries: ${matches.length}`);
    
    // Run SPR calculation with verbose option
    console.log('\n⚙️  Calculating Scouter Performance Ratings...\n');
    const result = computeScouterAccuracy(matches, officialResults, decodeConfig, {
      verbose: true,
      skipIncompleteAlliances: true
    });
    
    // Display results
    console.log('='.repeat(70));
    console.log('📈 SCOUTER PERFORMANCE RESULTS');
    console.log('='.repeat(70));
    
    if (!result.convergenceAchieved) {
      console.error('❌ FAILED:', result.message);
      console.log('\nℹ️  Convergence not achieved. Possible reasons:');
      console.log('   - Not enough match overlap between scouters');
      console.log('   - Too few matches with official results');
      console.log('   - Insufficient data for accurate calculations');
      return;
    }
    
    console.log(`\n✓ Convergence achieved`);
    console.log(`✓ Overall mean error: ${result.overallMeanError.toFixed(2)} points per alliance\n`);
    
    if (result.message) {
      console.log(`⚠️  ${result.message}\n`);
    }
    
    console.log('┌────────┬──────────────────┬─────────────┬──────────┬────────────┬──────────────┐');
    console.log('│ Rank   │ Scouter          │ Error Value │ Matches  │ Percentile │ Total Error  │');
    console.log('├────────┼──────────────────┼─────────────┼──────────┼────────────┼──────────────┤');
    
    result.scouters.forEach((scouter, index) => {
      const rank = `${index + 1}`.padStart(4);
      const name = scouter.scouterId.substring(0, 16).padEnd(16);
      const errorVal = scouter.errorValue.toFixed(2).padStart(9);
      const matches = `${scouter.matchesScounted}`.padStart(6);
      const percentile = `${scouter.percentile}%`.padStart(8);
      const totalErr = scouter.totalAbsoluteError.toFixed(2).padStart(10);
      
      // Add visual indicator for performance
      let indicator = '  ';
      if (scouter.percentile >= 75) indicator = '🌟'; // Top 25%
      else if (scouter.percentile >= 50) indicator = '✓ '; // Above average
      else if (scouter.percentile >= 25) indicator = '⚠️ '; // Below average
      else indicator = '❌'; // Bottom 25%
      
      console.log(`│${rank} ${indicator} │ ${name} │   ${errorVal} │  ${matches}  │  ${percentile}  │   ${totalErr} │`);
    });
    
    console.log('└────────┴──────────────────┴─────────────┴──────────┴────────────┴──────────────┘');
    
    // Analysis summary
    console.log('\n📊 Analysis Summary:');
    console.log('─'.repeat(70));
    
    const topPerformer = result.scouters[0];
    const bottomPerformer = result.scouters[result.scouters.length - 1];
    
    console.log(`\n🌟 Best Performer: ${topPerformer.scouterId}`);
    console.log(`   Error Value: ${topPerformer.errorValue.toFixed(2)} (contributes ~${topPerformer.errorValue.toFixed(2)} pts error/match)`);
    console.log(`   Matches Scouted: ${topPerformer.matchesScounted}`);
    console.log(`   Total Absolute Error: ${topPerformer.totalAbsoluteError.toFixed(2)} points`);
    
    console.log(`\n❌ Needs Improvement: ${bottomPerformer.scouterId}`);
    console.log(`   Error Value: ${bottomPerformer.errorValue.toFixed(2)} (contributes ~${bottomPerformer.errorValue.toFixed(2)} pts error/match)`);
    console.log(`   Matches Scouted: ${bottomPerformer.matchesScounted}`);
    console.log(`   Total Absolute Error: ${bottomPerformer.totalAbsoluteError.toFixed(2)} points`);
    
    const reliable = result.scouters.filter(s => s.matchesScounted >= 5);
    console.log(`\n✓ ${reliable.length}/${result.scouters.length} scouters have sufficient data (≥5 matches)`);
    
    if (result.scouters.length >= 4) {
      const topQuarter = result.scouters.slice(0, Math.ceil(result.scouters.length * 0.25));
      console.log(`✓ Top 25% performers: ${topQuarter.map(s => s.scouterId).join(', ')}`);
      
      const bottomQuarter = result.scouters.slice(Math.ceil(result.scouters.length * 0.75));
      console.log(`⚠️  Bottom 25% (needs help): ${bottomQuarter.map(s => s.scouterId).join(', ')}`);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ Test completed successfully!\n');
    
    // Validation checks
    console.log('🔍 Validation Checks:');
    const errorSpread = bottomPerformer.errorValue - topPerformer.errorValue;
    console.log(`   Error spread: ${errorSpread.toFixed(2)} points (${topPerformer.errorValue.toFixed(2)} to ${bottomPerformer.errorValue.toFixed(2)})`);
    console.log(`   Total scouters analyzed: ${result.scouters.length}`);
    console.log(`   Matches with official results: ${officialResults.size}`);
    console.log(`   Total match entries analyzed: ${matches.length}`);
    
    // Show verbose data if available
    if (result.verboseData) {
      const v = result.verboseData;
      console.log('\n📋 VERBOSE: All Alliance Equations Sent to Algorithm');
      console.log('─'.repeat(90));
      console.log(`   Total alliances: ${v.totalEquations} | Used: ${v.usedEquations} | Skipped: ${v.skippedEquations}`);
      console.log('─'.repeat(90));
      
      // Group by match number for cleaner display
      const matchMap = new Map<number, typeof v.equations>();
      v.equations.forEach(eq => {
        if (!matchMap.has(eq.matchNumber)) {
          matchMap.set(eq.matchNumber, []);
        }
        matchMap.get(eq.matchNumber)!.push(eq);
      });
      
      // Display each match
      for (const [matchNum, alliances] of Array.from(matchMap.entries()).sort((a, b) => a[0] - b[0])) {
        console.log(`\n   Match ${matchNum}:`);
        
        for (const eq of alliances.sort((a, b) => a.alliance.localeCompare(b.alliance))) {
          const allianceLabel = eq.alliance === 'red' ? '🔴 Red ' : '🔵 Blue';
          const status = eq.skipped ? `⏭️  SKIPPED (${eq.skipReason})` : '';
          
          if (eq.skipped) {
            console.log(`      ${allianceLabel}: ${status}`);
            console.log(`         Robots: ${eq.robotCount}/${eq.expectedRobots} | Scouters: ${eq.scouterIds.map(s => s.substring(5, 15)).join(', ') || 'none'}`);
          } else {
            const errorSign = eq.error >= 0 ? '+' : '';
            const errorIndicator = Math.abs(eq.error) <= 10 ? '✓' : Math.abs(eq.error) <= 25 ? '⚠️' : '❌';
            console.log(`      ${allianceLabel}: Predicted ${eq.scoutedTotal.toString().padStart(3)} | Official ${eq.adjustedOfficial.toString().padStart(3)} | Error ${errorSign}${eq.error.toString().padStart(3)} ${errorIndicator}`);
            console.log(`         Robots: ${eq.robotCount}/${eq.expectedRobots} | Scouters: ${eq.scouterIds.map(s => s.substring(5, 15)).join(', ')}`);
            console.log(`         (Raw official: ${eq.officialScore} - ${eq.foulPoints} fouls = ${eq.adjustedOfficial})`);
          }
        }
      }
      
      // Summary statistics
      const usedEquations = v.equations.filter(e => !e.skipped);
      if (usedEquations.length > 0) {
        const errors = usedEquations.map(e => e.error);
        const absErrors = errors.map(e => Math.abs(e));
        const avgError = absErrors.reduce((a, b) => a + b, 0) / absErrors.length;
        const maxError = Math.max(...absErrors);
        const minError = Math.min(...absErrors);
        const overCount = errors.filter(e => e > 0).length;
        const underCount = errors.filter(e => e < 0).length;
        
        console.log('\n' + '─'.repeat(90));
        console.log('   📊 Equation Statistics:');
        console.log(`      Average absolute error: ${avgError.toFixed(1)} pts`);
        console.log(`      Error range: ${minError} to ${maxError} pts`);
        console.log(`      Over-counting alliances: ${overCount} | Under-counting: ${underCount}`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    console.log('\nℹ️  Troubleshooting:');
    console.log('   1. Make sure dev server is running: pnpm dev');
    console.log('   2. Check that FTC_API_KEY is set in .env');
    console.log('   3. Verify event code USWAHALT exists in database');
    console.log('   4. Ensure match entries have userId field populated');
    process.exit(1);
  }
}

// Run the test
runTest();
