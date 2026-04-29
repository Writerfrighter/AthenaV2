"use client";

import { useMemo } from "react";
import { useSPRData } from "@/hooks/use-spr-data";

export type ScouterMedal = "gold" | "silver" | "bronze";

export type ScouterMedalMap = Record<string, ScouterMedal>;

function medalForRank(rank: number): ScouterMedal | null {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return null;
}

function decorateName(name: string, medal: ScouterMedal | null): string {
  if (!medal) return name;

  switch (medal) {
    case "gold":
      return `🥇 ${name} 🥇`;
    case "silver":
      return `🥈 ${name} 🥈`;
    case "bronze":
      return `🥉 ${name} 🥉`;
  }
}

export function useScouterMedals() {
  const { data, loading, error, refetch } = useSPRData();

  const medalsByScouterId = useMemo<ScouterMedalMap>(() => {
    const map: ScouterMedalMap = {};
    const scouters = data?.scouters ?? [];

    for (let i = 0; i < Math.min(3, scouters.length); i++) {
      const medal = medalForRank(i + 1);
      if (!medal) continue;
      map[scouters[i].scouterId] = medal;
    }

    return map;
  }, [data?.scouters]);

  const formatScouterName = useMemo(() => {
    return (scouterId: string, fallbackName: string) => {
      const medal = medalsByScouterId[scouterId] ?? null;
      return decorateName(fallbackName, medal);
    };
  }, [medalsByScouterId]);

  return {
    medalsByScouterId,
    formatScouterName,
    loading,
    error,
    refetch,
  };
}
