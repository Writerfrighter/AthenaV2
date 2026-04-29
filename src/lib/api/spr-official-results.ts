import { getEventMatches as getTbaEventMatches } from "@/lib/api/tba";
import { getEventMatches as getFtcEventMatches } from "@/lib/api/ftcevents";
import type { TbaMatch } from "@/lib/api/tba-types";
import type { FtcMatchResult } from "@/lib/api/ftcevents-types";
import type { CompetitionType } from "@/lib/types";

export type OfficialAllianceResult = {
  officialScore: number;
  foulPoints: number;
};

export type OfficialResultsMap = Record<
  number,
  {
    red: OfficialAllianceResult;
    blue: OfficialAllianceResult;
  }
>;

export interface OfficialResultsResponse {
  results: OfficialResultsMap;
  matchCount: number;
  eventCode: string;
  message?: string;
}

export class OfficialResultsError extends Error {
  status: number;
  details?: string;

  constructor(message: string, status: number, details?: string) {
    super(message);
    this.name = "OfficialResultsError";
    this.status = status;
    this.details = details;
  }
}

export async function fetchOfficialResults(
  eventCode: string,
  competitionType: CompetitionType = "FRC",
  year?: number,
): Promise<OfficialResultsResponse> {
  try {
    if (competitionType === "FTC") {
      const ftcYear = year ?? new Date().getFullYear();

      try {
        const matchData = await getFtcEventMatches(ftcYear, eventCode, "qual");

        if (
          !matchData ||
          !matchData.matches ||
          !Array.isArray(matchData.matches)
        ) {
          return {
            results: {},
            matchCount: 0,
            eventCode,
            message: "No qualification matches found for this FTC event",
          };
        }

        const results: OfficialResultsMap = {};

        for (const match of matchData.matches as FtcMatchResult[]) {
          const matchNumber = match.matchNumber;

          results[matchNumber] = {
            red: {
              officialScore: match.scoreRedFinal || 0,
              foulPoints: match.scoreRedFoul || 0,
            },
            blue: {
              officialScore: match.scoreBlueFinal || 0,
              foulPoints: match.scoreBlueFoul || 0,
            },
          };
        }

        return {
          results,
          matchCount: matchData.matches.length,
          eventCode,
        };
      } catch (error) {
        throw new OfficialResultsError(
          "Failed to fetch FTC match results. Check API key and event code.",
          502,
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    }

    const matches = await getTbaEventMatches(eventCode);

    if (!Array.isArray(matches)) {
      throw new OfficialResultsError("Invalid response from TBA", 502);
    }

    const qualMatches = matches.filter((m: TbaMatch) => m.comp_level === "qm");
    const results: OfficialResultsMap = {};

    for (const match of qualMatches) {
      const matchNumber = match.match_number;
      const redScore = match.alliances.red.score || 0;
      const blueScore = match.alliances.blue.score || 0;

      let redFouls = 0;
      let blueFouls = 0;

      if (match.score_breakdown) {
        const redBreakdown = match.score_breakdown.red;
        const blueBreakdown = match.score_breakdown.blue;

        if (typeof blueBreakdown.foulPoints === "number") {
          redFouls = blueBreakdown.foulPoints;
        } else if (typeof blueBreakdown.foulCount === "number") {
          redFouls = blueBreakdown.foulCount * 5;
        }

        if (typeof redBreakdown.foulPoints === "number") {
          blueFouls = redBreakdown.foulPoints;
        } else if (typeof redBreakdown.foulCount === "number") {
          blueFouls = redBreakdown.foulCount * 5;
        }
      }

      results[matchNumber] = {
        red: {
          officialScore: redScore,
          foulPoints: redFouls,
        },
        blue: {
          officialScore: blueScore,
          foulPoints: blueFouls,
        },
      };
    }

    return {
      results,
      matchCount: qualMatches.length,
      eventCode,
    };
  } catch (error) {
    if (error instanceof OfficialResultsError) {
      throw error;
    }

    throw new OfficialResultsError(
      "Failed to fetch official match results",
      500,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}
