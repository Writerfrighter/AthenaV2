/**
 * Test script for overall mean error on FRC 2025 WAB Event
 *
 * This script validates scouting accuracy using real FRC match data from 2025wabe event
 * with entries that have no associated users, focusing on overall mean error calculation.
 *
 * USAGE:
 *   pnpm tsx test-frc-2025wabe.ts
 *
 * WHAT IT TESTS:
 *   - Fetches match entries from local dev server (http://localhost:3000)
 *   - Fetches official results from FRC Events API
 *   - Calculates overall mean error across all alliances
 *
 * REQUIREMENTS:
 *   - Dev server must be running (pnpm dev)
 *   - FRC_API_KEY must be set in .env
 *   - Event 2025wabe must have match entries in database
 */

import { calculateEPA } from '../src/lib/statistics';
import type { MatchEntry } from '../src/db/types';
import { YearConfig } from '../src/lib/shared-types';

const DEV_SERVER = 'http://localhost:3000';
const EVENT_CODE = '2025wabe'; // FRC 2025 WAB Event
const SEASON = 2025;
const COMPETITION_TYPE = 'FRC';

// FRC 2025 REEFSCAPE game config
const reefscapeConfig: YearConfig = {
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
      leave: {
        label: 'Leave Starting Zone',
        points: 3,
        description: 'Robot leaves starting zone during autonomous',
        type: 'boolean'
      },
      L1_coral: {
        label: 'L1 Coral (Auto)',
        points: 3,
        description: 'Coral scored in trough (L1) during autonomous'
      },
      L2_coral: {
        label: 'L2 Coral (Auto)',
        points: 4,
        description: 'Coral scored on L2 branch during autonomous'
      },
      L3_coral: {
        label: 'L3 Coral (Auto)',
        points: 6,
        description: 'Coral scored on L3 branch during autonomous'
      },
      L4_coral: {
        label: 'L4 Coral (Auto)',
        points: 7,
        description: 'Coral scored on L4 branch during autonomous'
      },
      processor_algae: {
        label: 'Processor Algae (Auto)',
        points: 6,
        description: 'Algae scored in processor during autonomous'
      },
      net_algae: {
        label: 'Net Algae (Auto)',
        points: 4,
        description: 'Algae scored in net during autonomous'
      }
    },
    teleop: {
      L1_coral: {
        label: 'L1 Coral (Teleop)',
        points: 2,
        description: 'Coral scored in trough (L1) during teleoperated'
      },
      L2_coral: {
        label: 'L2 Coral (Teleop)',
        points: 3,
        description: 'Coral scored on L2 branch during teleoperated'
      },
      L3_coral: {
        label: 'L3 Coral (Teleop)',
        points: 4,
        description: 'Coral scored on L3 branch during teleoperated'
      },
      L4_coral: {
        label: 'L4 Coral (Teleop)',
        points: 5,
        description: 'Coral scored on L4 branch during teleoperated'
      },
      processor_algae: {
        label: 'Processor Algae (Teleop)',
        points: 6,
        description: 'Algae scored in processor during teleoperated'
      },
      net_algae: {
        label: 'Net Algae (Teleop)',
        points: 4,
        description: 'Algae scored in net during teleoperated'
      }
    },
    endgame: {
      ending_robot_state: {
        label: 'Ending Robot State',
        description: 'Robot\'s final position during endgame',
        pointValues: {
          none: 0,
          park: 3,
          shallow: 6,
          deep: 12
        }
      }
    },
    fouls: {
      fouls: {
        label: 'Fouls',
        points: -2,
        description: 'Minor penalties committed'
      },
      tech_fouls: {
        label: 'Tech Fouls',
        points: -5,
        description: 'Technical fouls committed'
      }
    }
  }
};

/*
 * Fetch match entries from dev server (entries without user associations)
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

    // Filter to entries WITHOUT userIds (no user associations)
    const entriesWithoutUsers = data.filter((entry: MatchEntry) =>
      !entry.userId || entry.userId.trim() === ''
    );

    console.log(`✓ Fetched ${data.length} total entries, ${entriesWithoutUsers.length} without user associations`);
    return entriesWithoutUsers;

  } catch (error) {
    console.error('❌ Failed to fetch match entries:', error);
    throw error;
  }
}

/**
 * Fetch official results from FRC Events API via dev server API route
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
 * Calculate overall mean error for alliances without user associations
 */
function calculateOverallMeanError(
  matches: MatchEntry[],
  officialResults: Map<number, { red: { officialScore: number; foulPoints: number }; blue: { officialScore: number; foulPoints: number } }>,
  config: YearConfig
): { overallMeanError: number; allianceErrors: Array<{ matchNumber: number; alliance: 'red' | 'blue'; scoutedTotal: number; officialScore: number; adjustedOfficial: number; error: number }> } {
  // Group matches by matchNumber and alliance
  const allianceGroups = new Map<string, MatchEntry[]>();
  matches.forEach(match => {
    const key = `${match.matchNumber}-${match.alliance}`;
    if (!allianceGroups.has(key)) {
      allianceGroups.set(key, []);
    }
    allianceGroups.get(key)!.push(match);
  });

  const allianceErrors: Array<{ matchNumber: number; alliance: 'red' | 'blue'; scoutedTotal: number; officialScore: number; adjustedOfficial: number; error: number }> = [];

  allianceGroups.forEach((allianceMatches, key) => {
    const [matchNumStr, alliance] = key.split('-');
    const matchNumber = parseInt(matchNumStr);
    const allianceKey = alliance as 'red' | 'blue';

    const officialData = officialResults.get(matchNumber);
    if (!officialData) return;

    const allianceOfficial = officialData[allianceKey];
    // Foul points are awarded TO the opposing alliance, so subtract opponent's fouls from this alliance's score
    const oppositeAllianceKey = allianceKey === 'red' ? 'blue' : 'red';
    const opponentFoulPoints = officialData[oppositeAllianceKey].foulPoints;
    const adjustedOfficialScore = allianceOfficial.officialScore - opponentFoulPoints;

    // Calculate total contributed points from scouted data
    let scoutedTotal = 0;
    allianceMatches.forEach(match => {
      const epa = calculateEPA([match], match.year, config);
      scoutedTotal += epa.totalEPA - epa.penalties; // Exclude penalties from scouted total
    });

    // Calculate error
    const error = scoutedTotal - adjustedOfficialScore;

    allianceErrors.push({
      matchNumber,
      alliance: allianceKey,
      scoutedTotal: Math.round(scoutedTotal),
      officialScore: allianceOfficial.officialScore,
      adjustedOfficial: adjustedOfficialScore,
      error: Math.round(error)
    });
  });

  // Calculate overall mean error (absolute so magnitude reflects deviation)
  const overallMeanError = allianceErrors.length > 0
    ? allianceErrors.reduce((sum, alliance) => sum + Math.abs(alliance.error), 0) / allianceErrors.length
    : 0;

  return { overallMeanError, allianceErrors };
}

/**
 * Run the test and display results
 */
async function runTest() {
  console.log('🧪 Testing Overall Mean Error on FRC 2025 WAB Event (2025wabe)\n');
  console.log('='.repeat(70));

  try {
    // Fetch data
    console.log('\n📊 Fetching data from dev server and FRC API...\n');
    const matches = await fetchMatchEntries();
    const officialResults = await fetchOfficialResults();

    if (matches.length === 0) {
      console.error('❌ No match entries found for event', EVENT_CODE);
      console.log('\nℹ️  Make sure:');
      console.log('   1. Dev server is running (pnpm dev)');
      console.log('   2. Event 2025wabe has match entries in the database');
      console.log('   3. Match entries have no userId field (no user associations)');
      return;
    }

    if (officialResults.size === 0) {
      console.error('❌ No official results found for event', EVENT_CODE);
      console.log('\nℹ️  Make sure:');
      console.log('   1. FRC_API_KEY is set in .env');
      console.log('   2. Event has completed matches with posted scores');
      return;
    }

    // Display match distribution
    const matchNumbers = new Set(matches.map(m => m.matchNumber));
    console.log(`\n📊 Match Coverage:`);
    console.log(`   Matches scouted: ${matchNumbers.size}`);
    console.log(`   Official results available: ${officialResults.size}`);
    console.log(`   Total match entries: ${matches.length}`);

    // Calculate overall mean error
    console.log('\n⚙️  Calculating Overall Mean Error...\n');
    const result = calculateOverallMeanError(matches, officialResults, reefscapeConfig);

    // Display results
    console.log('='.repeat(70));
    console.log('📈 OVERALL MEAN ERROR RESULTS');
    console.log('='.repeat(70));

    console.log(`\n✓ Overall mean error: ${result.overallMeanError.toFixed(2)} points per alliance\n`);

    console.log('┌──────────┬─────────┬─────────────┬─────────────┬─────────────┬────────────┐');
    console.log('│ Match    │ Alliance│ Scouted     │ Official    │ Adjusted    │ Error      │');
    console.log('│ Number   │         │ Total       │ Score       │ Official     │            │');
    console.log('├──────────┼─────────┼─────────────┼─────────────┼─────────────┼────────────┤');

    result.allianceErrors
      .sort((a, b) => a.matchNumber - b.matchNumber || a.alliance.localeCompare(b.alliance))
      .forEach(alliance => {
        const matchNum = `${alliance.matchNumber}`.padStart(8);
        const allianceLabel = alliance.alliance === 'red' ? '🔴 Red' : '🔵 Blue';
        const scouted = `${alliance.scoutedTotal}`.padStart(9);
        const official = `${alliance.officialScore}`.padStart(9);
        const adjusted = `${alliance.adjustedOfficial}`.padStart(9);
        const error = `${alliance.error >= 0 ? '+' : ''}${alliance.error}`.padStart(10);

        // Add visual indicator for error magnitude
        let indicator = '  ';
        const absError = Math.abs(alliance.error);
        if (absError <= 10) indicator = '✓ ';
        else if (absError <= 25) indicator = '⚠️ ';
        else indicator = '❌';

        console.log(`│${matchNum} │ ${allianceLabel} │   ${scouted} │   ${official} │   ${adjusted} │ ${error} ${indicator} │`);
      });

    console.log('└──────────┴─────────┴─────────────┴─────────────┴─────────────┴────────────┘');

    // Analysis summary
    console.log('\n📊 Analysis Summary:');
    console.log('─'.repeat(70));

    const errors = result.allianceErrors.map(a => a.error);
    const absErrors = errors.map(e => Math.abs(e));
    const maxError = Math.max(...absErrors);
    const minError = Math.min(...absErrors);
    const overCount = errors.filter(e => e > 0).length;
    const underCount = errors.filter(e => e < 0).length;

    console.log(`\n📈 Error Statistics:`);
    console.log(`   Average absolute error: ${result.overallMeanError.toFixed(1)} points`);
    console.log(`   Error range: ${minError} to ${maxError} points`);
    console.log(`   Over-counting alliances: ${overCount} | Under-counting: ${underCount}`);

    const highErrorAlliances = result.allianceErrors.filter(a => Math.abs(a.error) > 25);
    if (highErrorAlliances.length > 0) {
      console.log(`\n⚠️  High Error Alliances (>25 points):`);
      highErrorAlliances.forEach(a => {
        console.log(`   Match ${a.matchNumber} ${a.alliance.toUpperCase()}: ${a.error >= 0 ? '+' : ''}${a.error} points`);
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Test completed successfully!\n');

    // Validation checks
    console.log('🔍 Validation Checks:');
    console.log(`   Total alliances analyzed: ${result.allianceErrors.length}`);
    console.log(`   Matches with official results: ${officialResults.size}`);
    console.log(`   Total match entries analyzed: ${matches.length}`);

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    console.log('\nℹ️  Troubleshooting:');
    console.log('   1. Make sure dev server is running: pnpm dev');
    console.log('   2. Check that FRC_API_KEY is set in .env');
    console.log('   3. Verify event code 2025wabe exists in database');
    console.log('   4. Ensure match entries have no userId field (no user associations)');
    process.exit(1);
  }
}

// Run the test
runTest();