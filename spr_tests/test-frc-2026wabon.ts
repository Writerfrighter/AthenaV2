/**
 * Test script for SPR (Scouter Performance Rating) on FRC 2026 WAB Event
 *
 * This script validates the SPR algorithm using real FRC match data from 2026wabon event
 * with actual scouter userIds and official results from the FRC Events API.
 *
 * USAGE:
 *   pnpm tsx test-frc-2026wabon.ts
 *
 * WHAT IT TESTS:
 *   - Fetches match entries from local dev server (http://localhost:3000)
 *   - Fetches official results from FRC Events API
 *   - Runs SPR algorithm to rank scouter accuracy
 *   - Compares predicted vs official alliance scores
 *
 * REQUIREMENTS:
 *   - Dev server must be running (pnpm dev)
 *   - FRC_API_KEY must be set in .env
 *   - Event 2026wabon must have match entries in database
 */

import { computeScouterAccuracy } from "../src/lib/statistics";
import { YearConfig, MatchEntry } from "../src/lib/types";

const DEV_SERVER = "http://localhost:3000";
const EVENT_CODE = "2026wabon"; // FRC 2026 WAB Event
const SEASON = 2026;
const COMPETITION_TYPE = "FRC";

// FRC 2026 REBUILT game config
const rebuiltConfig: YearConfig = {
  competitionType: "FRC",
  gameName: "REBUILT",
  startPositions: [
    "Left Trench",
    "Left Bump",
    "Hub",
    "Right Bump",
    "Right Trench",
  ],
  pitScouting: {
    autonomous: {},
    teleoperated: {},
    endgame: {},
  },
  scoring: {
    autonomous: {
      fuel_scored: {
        label: "Fuel Scored (Auto)",
        points: 1,
        description: "Fuel scored during autonomous",
      },
      fuel_missed: {
        label: "Fuel Missed (Auto)",
        points: 0,
        description: "Fuel missed during autonomous",
      },
      fuel_shuttled: {
        label: "Fuel Shuttled (Auto)",
        points: 0,
        description: "Fuel shuttled during autonomous",
      },
      climb: {
        label: "Tower L1 (Auto)",
        points: 15,
        description: "L1 climbed during autonomous",
        type: "boolean",
      },
    },
    teleop: {
      fuel_scored: {
        label: "Fuel Scored (Teleop)",
        points: 1,
        description: "Fuel scored during teleoperated",
      },
      fuel_missed: {
        label: "Fuel Missed (Teleop)",
        points: 0,
        description: "Fuel missed during teleoperated",
      },
      fuel_shuttled: {
        label: "Fuel Shuttled (Teleop)",
        points: 0,
        description: "Fuel shuttled during teleoperated",
      },
      fuel_corraled: {
        label: "Fuel Corraled (Teleop)",
        points: 0,
        description: "Fuel put into the corral during teleoperated",
      },
    },
    endgame: {
      ending_robot_state: {
        label: "Ending Robot State",
        description: "Robot's final position during endgame",
        pointValues: {
          none: 0,
          L1: 10,
          L2: 20,
          L3: 30,
        },
      },
    },
    fouls: {
      fouls: {
        label: "Fouls",
        points: -3,
        description: "Minor penalties committed",
      },
      tech_fouls: {
        label: "Tech Fouls",
        points: -10,
        description: "Technical fouls committed",
      },
    },
  },
};

/**
 * Fetch user names from dev server and build a userId -> name map
 */
async function fetchUserNames(): Promise<Map<string, string>> {
  const nameMap = new Map<string, string>();
  try {
    const url = `${DEV_SERVER}/api/users`;
    const response = await fetch(url);
    if (!response.ok) return nameMap;
    const data = await response.json();
    if (data.users && Array.isArray(data.users)) {
      data.users.forEach((user: { id: string; name: string }) => {
        nameMap.set(user.id, user.name);
      });
    }
  } catch {
    // Silently fall back to IDs if users API is unavailable
  }
  return nameMap;
}

/** Resolve a userId to a display name, falling back to the ID */
function resolveName(userNameMap: Map<string, string>, userId: string): string {
  return userNameMap.get(userId) || userId;
}

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
      console.error(text.substring(0, 500));
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      const text = await response.text();
      console.error(`Expected JSON but got ${contentType}:`);
      console.error(text.substring(0, 500));
      throw new Error(
        `Server returned ${contentType} instead of JSON. Is the dev server running?`,
      );
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Expected array of match entries");
    }

    // Filter to only entries with userIds (scouters we want to evaluate)
    const entriesWithScouters = data.filter(
      (entry: MatchEntry) => entry.userId && entry.userId.trim() !== "",
    );

    console.log(
      `✓ Fetched ${data.length} total entries, ${entriesWithScouters.length} with scouter IDs`,
    );
    return entriesWithScouters;
  } catch (error) {
    console.error("❌ Failed to fetch match entries:", error);
    throw error;
  }
}

/**
 * Fetch official results from FRC Events API via dev server API route
 */
async function fetchOfficialResults(): Promise<
  Map<
    number,
    {
      red: { officialScore: number; foulPoints: number };
      blue: { officialScore: number; foulPoints: number };
    }
  >
> {
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

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      const text = await response.text();
      console.error(`Expected JSON but got ${contentType}:`);
      console.error(text.substring(0, 500));
      throw new Error(
        `Server returned ${contentType} instead of JSON. Is the dev server running?`,
      );
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Convert results object to Map
    const resultsMap = new Map();
    if (data.results && typeof data.results === "object") {
      for (const [matchNum, scores] of Object.entries(data.results)) {
        resultsMap.set(parseInt(matchNum), scores);
      }
    }

    console.log(`✓ Fetched ${resultsMap.size} official match results`);
    return resultsMap;
  } catch (error) {
    console.error("❌ Failed to fetch official results:", error);
    throw error;
  }
}

/**
 * Run the test and display results
 */
async function runTest() {
  console.log("🧪 Testing SPR on FRC 2026 WAB Event (2026wabon)\n");
  console.log("=".repeat(70));

  try {
    // Fetch data
    console.log("\n📊 Fetching data from dev server and FRC API...\n");
    const matches = await fetchMatchEntries();
    const officialResults = await fetchOfficialResults();
    const userNameMap = await fetchUserNames();
    if (userNameMap.size > 0) {
      console.log(`✓ Resolved ${userNameMap.size} user names`);
    } else {
      console.log(
        "⚠️  Could not fetch user names (auth required?), displaying user IDs",
      );
    }

    if (matches.length === 0) {
      console.error("❌ No match entries found for event", EVENT_CODE);
      console.log("\nℹ️  Make sure:");
      console.log("   1. Dev server is running (pnpm dev)");
      console.log("   2. Event 2026wabon has match entries in the database");
      console.log("   3. Match entries have userId field populated");
      return;
    }

    if (officialResults.size === 0) {
      console.error("❌ No official results found for event", EVENT_CODE);
      console.log("\nℹ️  Make sure:");
      console.log("   1. FRC_API_KEY is set in .env");
      console.log("   2. Event has completed matches with posted scores");
      return;
    }

    // Display scouter distribution
    const scouterCounts = new Map<string, number>();
    matches.forEach((m) => {
      if (m.userId) {
        scouterCounts.set(m.userId, (scouterCounts.get(m.userId) || 0) + 1);
      }
    });

    console.log("\n📋 Scouter Assignment Distribution:");
    scouterCounts.forEach((count, scouter) => {
      console.log(`   ${resolveName(userNameMap, scouter)}: ${count} matches`);
    });

    // Display match distribution
    const matchNumbers = new Set(matches.map((m) => m.matchNumber));
    console.log(`\n📊 Match Coverage:`);
    console.log(`   Matches scouted: ${matchNumbers.size}`);
    console.log(`   Official results available: ${officialResults.size}`);
    console.log(`   Total match entries: ${matches.length}`);

    // Run SPR calculation with verbose option
    console.log("\n⚙️  Calculating Scouter Performance Ratings...\n");
    const result = computeScouterAccuracy(
      matches,
      officialResults,
      rebuiltConfig,
      {
        verbose: true,
        skipIncompleteAlliances: true,
      },
    );

    // Display results
    console.log("=".repeat(70));
    console.log("📈 SCOUTER PERFORMANCE RESULTS");
    console.log("=".repeat(70));

    if (!result.convergenceAchieved) {
      console.error("❌ FAILED:", result.message);
      console.log("\nℹ️  Convergence not achieved. Possible reasons:");
      console.log("   - Not enough match overlap between scouters");
      console.log("   - Too few matches with official results");
      console.log("   - Insufficient data for accurate calculations");
      return;
    }

    console.log(`\n✓ Convergence achieved`);
    console.log(
      `✓ Overall mean error: ${result.overallMeanError.toFixed(2)} points per alliance\n`,
    );

    if (result.message) {
      console.log(`⚠️  ${result.message}\n`);
    }

    console.log(
      "┌────────┬──────────────────┬─────────────┬──────────┬────────────┬──────────────┐",
    );
    console.log(
      "│ Rank   │ Scouter          │ Error Value │ Matches  │ Percentile │ Total Error  │",
    );
    console.log(
      "├────────┼──────────────────┼─────────────┼──────────┼────────────┼──────────────┤",
    );

    result.scouters.forEach((scouter, index) => {
      const rank = `${index + 1}`.padStart(4);
      const name = resolveName(userNameMap, scouter.scouterId)
        .substring(0, 16)
        .padEnd(16);
      const errorVal = scouter.errorValue.toFixed(2).padStart(9);
      const matches = `${scouter.matchesScounted}`.padStart(6);
      const percentile = `${scouter.percentile}%`.padStart(8);
      const totalErr = scouter.totalAbsoluteError.toFixed(2).padStart(10);

      // Add visual indicator for performance
      let indicator = "  ";
      if (scouter.percentile >= 75) indicator = "🌟";
      else if (scouter.percentile >= 50) indicator = "✓ ";
      else if (scouter.percentile >= 25) indicator = "⚠️ ";
      else indicator = "❌";

      console.log(
        `│${rank} ${indicator} │ ${name} │   ${errorVal} │  ${matches}  │  ${percentile}  │   ${totalErr} │`,
      );
    });

    console.log(
      "└────────┴──────────────────┴─────────────┴──────────┴────────────┴──────────────┘",
    );

    // Analysis summary
    console.log("\n📊 Analysis Summary:");
    console.log("─".repeat(70));

    const topPerformer = result.scouters[0];
    const bottomPerformer = result.scouters[result.scouters.length - 1];

    console.log(
      `\n🌟 Best Performer: ${resolveName(userNameMap, topPerformer.scouterId)}`,
    );
    console.log(
      `   Error Value: ${topPerformer.errorValue.toFixed(2)} (contributes ~${topPerformer.errorValue.toFixed(2)} pts error/match)`,
    );
    console.log(`   Matches Scouted: ${topPerformer.matchesScounted}`);
    console.log(
      `   Total Absolute Error: ${topPerformer.totalAbsoluteError.toFixed(2)} points`,
    );

    console.log(
      `\n❌ Needs Improvement: ${resolveName(userNameMap, bottomPerformer.scouterId)}`,
    );
    console.log(
      `   Error Value: ${bottomPerformer.errorValue.toFixed(2)} (contributes ~${bottomPerformer.errorValue.toFixed(2)} pts error/match)`,
    );
    console.log(`   Matches Scouted: ${bottomPerformer.matchesScounted}`);
    console.log(
      `   Total Absolute Error: ${bottomPerformer.totalAbsoluteError.toFixed(2)} points`,
    );

    const reliable = result.scouters.filter((s) => s.matchesScounted >= 5);
    console.log(
      `\n✓ ${reliable.length}/${result.scouters.length} scouters have sufficient data (≥5 matches)`,
    );

    if (result.scouters.length >= 4) {
      const topQuarter = result.scouters.slice(
        0,
        Math.ceil(result.scouters.length * 0.25),
      );
      console.log(
        `✓ Top 25% performers: ${topQuarter.map((s) => resolveName(userNameMap, s.scouterId)).join(", ")}`,
      );

      const bottomQuarter = result.scouters.slice(
        Math.ceil(result.scouters.length * 0.75),
      );
      console.log(
        `⚠️  Bottom 25% (needs help): ${bottomQuarter.map((s) => resolveName(userNameMap, s.scouterId)).join(", ")}`,
      );
    }

    console.log("\n" + "=".repeat(70));
    console.log("✅ Test completed successfully!\n");

    // Validation checks
    console.log("🔍 Validation Checks:");
    const errorSpread = bottomPerformer.errorValue - topPerformer.errorValue;
    console.log(
      `   Error spread: ${errorSpread.toFixed(2)} points (${topPerformer.errorValue.toFixed(2)} to ${bottomPerformer.errorValue.toFixed(2)})`,
    );
    console.log(`   Total scouters analyzed: ${result.scouters.length}`);
    console.log(`   Matches with official results: ${officialResults.size}`);
    console.log(`   Total match entries analyzed: ${matches.length}`);

    // Show verbose data if available
    if (result.verboseData) {
      const v = result.verboseData;
      console.log("\n📋 VERBOSE: All Alliance Equations Sent to Algorithm");
      console.log("─".repeat(90));
      console.log(
        `   Total alliances: ${v.totalEquations} | Used: ${v.usedEquations} | Skipped: ${v.skippedEquations}`,
      );
      console.log("─".repeat(90));

      // Group by match number for cleaner display
      const matchMap = new Map<number, typeof v.equations>();
      v.equations.forEach((eq) => {
        if (!matchMap.has(eq.matchNumber)) {
          matchMap.set(eq.matchNumber, []);
        }
        matchMap.get(eq.matchNumber)!.push(eq);
      });

      // Display each match
      for (const [matchNum, alliances] of Array.from(matchMap.entries()).sort(
        (a, b) => a[0] - b[0],
      )) {
        console.log(`\n   Match ${matchNum}:`);

        for (const eq of alliances.sort((a, b) =>
          a.alliance.localeCompare(b.alliance),
        )) {
          const allianceLabel = eq.alliance === "red" ? "🔴 Red " : "🔵 Blue";
          const status = eq.skipped ? `⏭️  SKIPPED (${eq.skipReason})` : "";

          if (eq.skipped) {
            console.log(`      ${allianceLabel}: ${status}`);
            console.log(
              `         Robots: ${eq.robotCount}/${eq.expectedRobots} | Scouters: ${eq.scouterIds.map((s) => resolveName(userNameMap, s)).join(", ") || "none"}`,
            );
          } else {
            const errorSign = eq.error >= 0 ? "+" : "";
            const errorIndicator =
              Math.abs(eq.error) <= 10
                ? "✓"
                : Math.abs(eq.error) <= 25
                  ? "⚠️"
                  : "❌";
            console.log(
              `      ${allianceLabel}: Predicted ${eq.scoutedTotal.toString().padStart(3)} | Official ${eq.adjustedOfficial.toString().padStart(3)} | Error ${errorSign}${eq.error.toString().padStart(3)} ${errorIndicator}`,
            );
            console.log(
              `         Robots: ${eq.robotCount}/${eq.expectedRobots} | Scouters: ${eq.scouterIds.map((s) => resolveName(userNameMap, s)).join(", ")}`,
            );
            console.log(
              `         (Raw official: ${eq.officialScore} - ${eq.foulPoints} fouls = ${eq.adjustedOfficial})`,
            );
          }
        }
      }

      // Summary statistics
      const usedEquations = v.equations.filter((e) => !e.skipped);
      if (usedEquations.length > 0) {
        const errors = usedEquations.map((e) => e.error);
        const absErrors = errors.map((e) => Math.abs(e));
        const avgError =
          absErrors.reduce((a, b) => a + b, 0) / absErrors.length;
        const maxError = Math.max(...absErrors);
        const minError = Math.min(...absErrors);
        const overCount = errors.filter((e) => e > 0).length;
        const underCount = errors.filter((e) => e < 0).length;

        console.log("\n" + "─".repeat(90));
        console.log("   📊 Equation Statistics:");
        console.log(`      Average absolute error: ${avgError.toFixed(1)} pts`);
        console.log(`      Error range: ${minError} to ${maxError} pts`);
        console.log(
          `      Over-counting alliances: ${overCount} | Under-counting: ${underCount}`,
        );
      }
    }
  } catch (error) {
    console.error("\n❌ Test failed with error:", error);
    console.log("\nℹ️  Troubleshooting:");
    console.log("   1. Make sure dev server is running: pnpm dev");
    console.log("   2. Check that FRC_API_KEY is set in .env");
    console.log("   3. Verify event code 2026wabon exists in database");
    console.log("   4. Ensure match entries have userId field populated");
    process.exit(1);
  }
}

// Run the test
runTest();
