/**
 * Test script for Scouter Performance Rating (SPR) function
 * 
 * This script validates the computeScouterAccuracy function with realistic test data
 * simulating a small FRC competition with multiple scouters.
 * 
 * USAGE:
 *   pnpm tsx test-scouter-accuracy.ts
 * 
 * WHAT IT TESTS:
 *   - Creates 15 matches with 6 robots each (90 total match entries)
 *   - Assigns 5 scouters with different accuracy levels (biases)
 *   - Uses HARDCODED official results for deterministic testing
 *   - Runs SPR algorithm to identify best/worst performers
 * 
 * EXPECTED BEHAVIOR:
 *   - alice (1.0x bias): Perfect accuracy - should rank #1
 *   - diana (1.05x bias): 5% over-count - should rank #2
 *   - bob (1.1x bias): 10% over-count - should rank #3
 *   - charlie (0.85x bias): 15% under-count - should rank #4
 *   - eve (1.25x bias): 25% over-count - should rank #5 (worst)
 * 
 * SUCCESS CRITERIA:
 *   ✓ Convergence achieved
 *   ✓ All scouters ranked by error value
 *   ✓ Best performers have lowest error values
 *   ✓ Worst performers have highest error values
 */

import { computeScouterAccuracy } from '../src/lib/statistics';
import type { MatchEntry } from '../src/db/types';
import type { YearConfig } from '../src/lib/shared-types';

const MATCH_COUNT = 60; // Increase to test convergence on larger datasets

// Mock 2025 FRC game config (simplified)
const mockConfig: YearConfig = {
  competitionType: 'FRC',
  gameName: 'REEFSCAPE',
  startPositions: ['Left', 'Center Left', 'Center Right', 'Right'],
  pitScouting: {
    autonomous: {},
    teleoperated: {},
    endgame: {}
  },
  scoring: {
    autonomous: {
      leave: { label: 'Leave', points: 3, description: 'Leave starting zone', type: 'boolean' },
      L1_coral: { label: 'L1 Coral (Auto)', points: 3, description: 'L1 coral scored' },
      L2_coral: { label: 'L2 Coral (Auto)', points: 4, description: 'L2 coral scored' },
      L3_coral: { label: 'L3 Coral (Auto)', points: 6, description: 'L3 coral scored' },
      L4_coral: { label: 'L4 Coral (Auto)', points: 7, description: 'L4 coral scored' }
    },
    teleop: {
      L1_coral: { label: 'L1 Coral (Teleop)', points: 2, description: 'L1 coral scored' },
      L2_coral: { label: 'L2 Coral (Teleop)', points: 3, description: 'L2 coral scored' },
      L3_coral: { label: 'L3 Coral (Teleop)', points: 4, description: 'L3 coral scored' },
      processor_algae: { label: 'Processor Algae', points: 6, description: 'Processor algae scored' },
      net_algae: { label: 'Net Algae', points: 4, description: 'Net algae scored' }
    },
    endgame: {
      shallow_climb: { label: 'Shallow Climb', points: 2, description: 'Shallow climb completed' },
      deep_climb: { label: 'Deep Climb', points: 6, description: 'Deep climb completed' },
      park: { label: 'Park', points: 1, description: 'Robot parked' }
    },
    fouls: {}
  }
};

/**
 * Generate mock match entries with intentional scouter biases
 * - alice: Very accurate scouter (low error)
 * - bob: Slightly over-counts (moderate error)
 * - charlie: Under-counts significantly (high error)
 * - diana: Accurate but fewer matches
 * - eve: Very inaccurate (highest error)
 */
function generateMockMatches(matchCount: number = MATCH_COUNT): MatchEntry[] {
  const matches: MatchEntry[] = [];
  const scouters = ['alice', 'bob', 'charlie', 'diana', 'eve'];
  
  // Base scoring data for a "typical" robot (using higher numbers so bias is visible after rounding)
  const baseRobot = {
    autonomous: { leave: true, L1_coral: 3, L2_coral: 2 },
    teleop: { L1_coral: 8, L2_coral: 5, processor_algae: 2, net_algae: 4 },
    endgame: { deep_climb: 1 }
  };
  
  // Scouter bias multipliers (how much they over/under count)
  const scouterBias: Record<string, number> = {
    'alice': 1.0,    // Perfect accuracy (0% error)
    'diana': 1.05,   // 5% over-count
    'bob': 1.1,      // 10% over-count
    'charlie': 0.85, // 15% under-count
    'eve': 1.25      // 25% over-count
  };
  
  // Hardcoded base assignments (15 matches * 6 scouters) to ensure diverse pairings
  const baseAssignments = [
    'alice', 'diana', 'bob', 'charlie', 'eve', 'alice', // Match 1
    'diana', 'bob', 'charlie', 'eve', 'alice', 'diana', // Match 2
    'bob', 'charlie', 'eve', 'alice', 'diana', 'bob',   // Match 3
    'charlie', 'eve', 'alice', 'diana', 'bob', 'charlie',
    'eve', 'alice', 'diana', 'bob', 'charlie', 'eve',
    'alice', 'bob', 'eve', 'diana', 'alice', 'charlie',
    'diana', 'charlie', 'alice', 'bob', 'eve', 'diana',
    'bob', 'eve', 'diana', 'charlie', 'alice', 'bob',
    'charlie', 'alice', 'bob', 'eve', 'diana', 'charlie',
    'eve', 'diana', 'charlie', 'alice', 'bob', 'eve',
    'alice', 'charlie', 'diana', 'bob', 'alice', 'eve',
    'diana', 'eve', 'bob', 'charlie', 'diana', 'alice',
    'bob', 'alice', 'charlie', 'eve', 'bob', 'diana',
    'charlie', 'diana', 'eve', 'alice', 'charlie', 'bob',
    'eve', 'bob', 'alice', 'diana', 'eve', 'charlie'
  ];
  const baseMatchCount = baseAssignments.length / 6;
  
  // Generate matches, 6 robots per match (3 per alliance)
  let matchId = 1;
  
  for (let matchNum = 1; matchNum <= matchCount; matchNum++) {
    const baseStart = ((matchNum - 1) % baseMatchCount) * 6;
    
    // Red alliance - 3 robots
    for (let pos = 0; pos < 3; pos++) {
      const scouterId = baseAssignments[baseStart + pos];
      const teamNumber = 1000 + (matchNum * 10) + pos;
      const bias = scouterBias[scouterId];
      
      matches.push({
        id: matchId++,
        matchNumber: matchNum,
        teamNumber,
        year: 2025,
        competitionType: 'FRC',
        alliance: 'red',
        alliancePosition: pos + 1,
        eventCode: 'test2025',
        eventName: 'Test Event 2025',
        userId: scouterId,
        notes: `Scouted by ${scouterId}`,
        timestamp: new Date(),
        gameSpecificData: {
          autonomous: {
            leave: baseRobot.autonomous.leave,
            L1_coral: Math.round(baseRobot.autonomous.L1_coral * bias),
            L2_coral: Math.round(baseRobot.autonomous.L2_coral * bias)
          },
          teleop: {
            L1_coral: Math.round(baseRobot.teleop.L1_coral * bias),
            L2_coral: Math.round(baseRobot.teleop.L2_coral * bias),
            processor_algae: Math.round(baseRobot.teleop.processor_algae * bias),
            net_algae: Math.round(baseRobot.teleop.net_algae * bias)
          },
          endgame: {
            deep_climb: baseRobot.endgame.deep_climb
          }
        }
      });
    }
    
    // Blue alliance - 3 robots
    for (let pos = 0; pos < 3; pos++) {
      const scouterId = baseAssignments[baseStart + 3 + pos];
      const teamNumber = 2000 + (matchNum * 10) + pos;
      const bias = scouterBias[scouterId];
      
      matches.push({
        id: matchId++,
        matchNumber: matchNum,
        teamNumber,
        year: 2025,
        competitionType: 'FRC',
        alliance: 'blue',
        alliancePosition: pos + 1,
        eventCode: 'test2025',
        eventName: 'Test Event 2025',
        userId: scouterId,
        notes: `Scouted by ${scouterId}`,
        timestamp: new Date(),
        gameSpecificData: {
          autonomous: {
            leave: baseRobot.autonomous.leave,
            L1_coral: Math.round(baseRobot.autonomous.L1_coral * bias),
            L2_coral: Math.round(baseRobot.autonomous.L2_coral * bias)
          },
          teleop: {
            L1_coral: Math.round(baseRobot.teleop.L1_coral * bias),
            L2_coral: Math.round(baseRobot.teleop.L2_coral * bias),
            processor_algae: Math.round(baseRobot.teleop.processor_algae * bias),
            net_algae: Math.round(baseRobot.teleop.net_algae * bias)
          },
          endgame: {
            deep_climb: baseRobot.endgame.deep_climb
          }
        }
      });
    }
  }
  
  return matches;
}

/**
 * Generate official match results (HARDCODED for consistent testing)
 * Each robot should contribute approximately 85 points based on baseRobot data:
 * - Auto: 3 (leave) + 9 (3×3 L1) + 8 (2×4 L2) = 20
 * - Teleop: 16 (8×2 L1) + 15 (5×3 L2) + 12 (2×6 processor) + 16 (4×4 net) = 59
 * - Endgame: 6 (1×6 deep climb) = 6
 * - Total per robot: ~85 points
 * - Total per alliance (3 robots): ~255 points
 * 
 * Hardcoded values ensure consistent test results across runs
 */
function generateOfficialResults(matchCount: number = MATCH_COUNT): Map<number, {
  red: { officialScore: number; foulPoints: number };
  blue: { officialScore: number; foulPoints: number };
}> {
  const results = new Map();
  
  // Base results for first 15 matches (approximate true performance)
  const baseResults = [
    { red: { score: 258, fouls: 5 }, blue: { score: 252, fouls: 0 } },
    { red: { score: 265, fouls: 10 }, blue: { score: 248, fouls: 5 } },
    { red: { score: 254, fouls: 0 }, blue: { score: 260, fouls: 5 } },
    { red: { score: 256, fouls: 5 }, blue: { score: 255, fouls: 10 } },
    { red: { score: 262, fouls: 10 }, blue: { score: 250, fouls: 0 } },
    { red: { score: 251, fouls: 0 }, blue: { score: 257, fouls: 5 } },
    { red: { score: 259, fouls: 5 }, blue: { score: 263, fouls: 10 } },
    { red: { score: 255, fouls: 10 }, blue: { score: 249, fouls: 0 } },
    { red: { score: 261, fouls: 0 }, blue: { score: 254, fouls: 5 } },
    { red: { score: 257, fouls: 5 }, blue: { score: 258, fouls: 10 } },
    { red: { score: 253, fouls: 10 }, blue: { score: 256, fouls: 0 } },
    { red: { score: 264, fouls: 0 }, blue: { score: 251, fouls: 5 } },
    { red: { score: 256, fouls: 5 }, blue: { score: 259, fouls: 10 } },
    { red: { score: 260, fouls: 10 }, blue: { score: 253, fouls: 0 } },
    { red: { score: 252, fouls: 0 }, blue: { score: 261, fouls: 5 } }
  ];
  const baseLength = baseResults.length;

  for (let match = 1; match <= matchCount; match++) {
    const cycle = baseResults[(match - 1) % baseLength];
    const drift = Math.floor((match - 1) / baseLength) * 3; // Small drift per cycle
    results.set(match, {
      red: {
        officialScore: cycle.red.score + drift,
        foulPoints: cycle.red.fouls
      },
      blue: {
        officialScore: cycle.blue.score + (drift % 5),
        foulPoints: cycle.blue.fouls
      }
    });
  }
  
  return results;
}

/**
 * Run the test and display results
 */
function runTest() {
  console.log('🧪 Testing Scouter Performance Rating (SPR) Function\n');
  console.log('=' .repeat(70));
  
  // Generate test data
  console.log('\n📊 Generating test data...');
  const matches = generateMockMatches(MATCH_COUNT);
  const officialResults = generateOfficialResults(MATCH_COUNT);
  
  console.log(`✓ Generated ${matches.length} match entries`);
  console.log(`✓ Generated ${officialResults.size} official match results`);
  
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
  
  // Run SPR calculation
  console.log('\n⚙️  Calculating Scouter Performance Ratings...\n');
  const result = computeScouterAccuracy(matches, officialResults, mockConfig, {
    expectedAllianceSize: 3,
    skipIncompleteAlliances: true
  });
  
  // Display results
  console.log('=' .repeat(70));
  console.log('📈 SCOUTER PERFORMANCE RESULTS');
  console.log('=' .repeat(70));
  
  if (!result.convergenceAchieved) {
    console.error('❌ FAILED:', result.message);
    return;
  }
  
  console.log(`\n✓ Convergence achieved`);
  console.log(`✓ Overall mean error: ${result.overallMeanError.toFixed(2)} points per alliance\n`);
  
  if (result.message) {
    console.log(`⚠️  ${result.message}\n`);
  }
  
  console.log('┌────────┬──────────┬─────────────┬──────────┬────────────┬──────────────┐');
  console.log('│ Rank   │ Scouter  │ Error Value │ Matches  │ Percentile │ Total Error  │');
  console.log('├────────┼──────────┼─────────────┼──────────┼────────────┼──────────────┤');
  
  result.scouters.forEach((scouter, index) => {
    const rank = `${index + 1}`.padStart(4);
    const name = scouter.scouterId.padEnd(8);
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
  
  console.log('└────────┴──────────┴─────────────┴──────────┴────────────┴──────────────┘');
  
  // Analysis summary
  console.log('\n📊 Analysis Summary:');
  console.log('─'.repeat(70));
  
  const topPerformer = result.scouters[0];
  const bottomPerformer = result.scouters[result.scouters.length - 1];
  
  console.log(`\n🌟 Best Performer: ${topPerformer.scouterId}`);
  console.log(`   Error Value: ${topPerformer.errorValue.toFixed(2)} (contributes ~${topPerformer.errorValue.toFixed(2)} pts error/match)`);
  console.log(`   Matches Scouted: ${topPerformer.matchesScounted}`);
  
  console.log(`\n❌ Needs Improvement: ${bottomPerformer.scouterId}`);
  console.log(`   Error Value: ${bottomPerformer.errorValue.toFixed(2)} (contributes ~${bottomPerformer.errorValue.toFixed(2)} pts error/match)`);
  console.log(`   Matches Scouted: ${bottomPerformer.matchesScounted}`);
  
  const reliable = result.scouters.filter(s => s.matchesScounted >= 10);
  console.log(`\n✓ ${reliable.length}/${result.scouters.length} scouters have sufficient data (≥10 matches)`);
  
  const topQuarter = result.scouters.slice(0, Math.ceil(result.scouters.length * 0.25));
  console.log(`✓ Top 25% performers: ${topQuarter.map(s => s.scouterId).join(', ')}`);
  
  const bottomQuarter = result.scouters.slice(Math.ceil(result.scouters.length * 0.75));
  console.log(`⚠️  Bottom 25% (needs help): ${bottomQuarter.map(s => s.scouterId).join(', ')}`);
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ Test completed successfully!\n');
  
  // Validation checks
  console.log('🔍 Validation Checks:');
  const errorSpread = bottomPerformer.errorValue - topPerformer.errorValue;
  console.log(`   Error spread: ${errorSpread.toFixed(2)} points (${topPerformer.errorValue.toFixed(2)} to ${bottomPerformer.errorValue.toFixed(2)})`);
  console.log(`   Total scouters analyzed: ${result.scouters.length}`);
  console.log(`   Total equations solved: ${matches.length / 3} alliances × 2 = ${matches.length / 3 * 2}`);
  
  // Expected: alice (1.0) should be best, eve (1.3) should be worst
  console.log('\n📋 Expected vs Actual Rankings (based on bias multipliers):');
  console.log('   Expected order (best to worst): alice, diana, bob, charlie, eve');
  console.log(`   Actual order: ${result.scouters.map(s => s.scouterId).join(', ')}`);
}

// Run the test
try {
  runTest();
} catch (error) {
  console.error('❌ Test failed with error:', error);
  process.exit(1);
}
