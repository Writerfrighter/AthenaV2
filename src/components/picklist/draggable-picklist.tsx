"use client";

import { useState, useCallback, useMemo, useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { ReactSortable, ItemInterface } from "react-sortablejs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  GripVertical,
  Trash2,
  Save,
} from "lucide-react";
import { CompetitionType, PicklistEntry } from "@/lib/types";
import { usePicklist } from "@/hooks/use-picklist";
import { useGameConfig } from "@/hooks/use-game-config";
import { useEventTeams } from "@/hooks/use-event-teams";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { toast } from "sonner";

interface DraggablePicklistProps {
  eventCode: string;
  year: number;
  competitionType: CompetitionType;
  ownTeamNumber?: number;
}

interface TeamEPAData {
  totalEPA: number;
  autoEPA: number;
  teleopEPA: number;
  endgameEPA: number;
}

/** Shapes of the API responses this component reads. */
interface RankingItemResponse {
  team_key: string;
  rank: number;
}

interface RankingBlockResponse {
  rankings?: RankingItemResponse[];
}

interface PicklistTeamResponse {
  teamNumber: number;
  totalEPA?: number;
  autoEPA?: number;
  teleopEPA?: number;
  endgameEPA?: number;
}

interface PicklistNoteResponse {
  teamNumber: number;
  note?: string | null;
}

interface SortableTeamItem extends ItemInterface {
  id: string;
  teamNumber: number;
  isBlacklisted?: boolean;
}

export function DraggablePicklist({
  eventCode,
  year,
  competitionType,
  ownTeamNumber = 492,
}: DraggablePicklistProps) {
  const [expandedTeams, setExpandedTeams] = useState<Set<number>>(new Set());
  const [teamNotes, setTeamNotes] = useState<Record<number, string>>({});
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [qualRankings, setQualRankings] = useState<Map<number, number>>(
    new Map(),
  );
  const [epaData, setEpaData] = useState<Map<number, TeamEPAData>>(new Map());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [localPick1Order, setLocalPick1Order] = useState<SortableTeamItem[]>(
    [],
  );
  const [localPick2Order, setLocalPick2Order] = useState<SortableTeamItem[]>(
    [],
  );
  const [localBlacklistOrder, setLocalBlacklistOrder] = useState<
    SortableTeamItem[]
  >([]);
  const [localUnlisted, setLocalUnlisted] = useState<SortableTeamItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeList, setActiveList] = useState<PickListType>("1stPick");
  const noteSaveTimersRef = useRef<Record<number, NodeJS.Timeout>>({});
  const notesLoadedRef = useRef(false);
  const pick1IdRef = useRef<number | undefined>(undefined);
  const pick2IdRef = useRef<number | undefined>(undefined);
  const blacklistIdRef = useRef<number | undefined>(undefined);
  const localPick1Ref = useRef<SortableTeamItem[]>([]);
  const localPick2Ref = useRef<SortableTeamItem[]>([]);
  const localBlacklistRef = useRef<SortableTeamItem[]>([]);

  // Get all event teams
  const { teams: allEventTeams = [], loading: isEventTeamsLoading } =
    useEventTeams();

  // Initialize picklists
  const pick1 = usePicklist({
    eventCode,
    year,
    competitionType,
    picklistType: "pick1",
  });

  const pick2 = usePicklist({
    eventCode,
    year,
    competitionType,
    picklistType: "pick2",
  });

  const blacklist = usePicklist({
    eventCode,
    year,
    competitionType,
    picklistType: "blacklist",
  });

  // Keep refs in sync for use in debounced autosave (avoids stale closures)
  useEffect(() => {
    pick1IdRef.current = pick1.picklist?.id;
  }, [pick1.picklist?.id]);
  useEffect(() => {
    pick2IdRef.current = pick2.picklist?.id;
  }, [pick2.picklist?.id]);
  useEffect(() => {
    blacklistIdRef.current = blacklist.picklist?.id;
  }, [blacklist.picklist?.id]);
  useEffect(() => {
    localPick1Ref.current = localPick1Order;
  }, [localPick1Order]);
  useEffect(() => {
    localPick2Ref.current = localPick2Order;
  }, [localPick2Order]);
  useEffect(() => {
    localBlacklistRef.current = localBlacklistOrder;
  }, [localBlacklistOrder]);

  // Helper to convert PicklistEntry[] to SortableTeamItem[]
  const toSortableItems = useCallback(
    (entries: PicklistEntry[]): SortableTeamItem[] => {
      return entries.map((e) => ({
        id: String(e.teamNumber),
        teamNumber: e.teamNumber,
      }));
    },
    [],
  );

  // Sync local state with picklist entries (but not during save). Done
  // during render so the saved order shows without an extra paint.
  const [syncedEntries, setSyncedEntries] = useState({
    pick1: pick1.entries,
    pick2: pick2.entries,
    blacklist: blacklist.entries,
    isSaving,
  });
  if (
    syncedEntries.pick1 !== pick1.entries ||
    syncedEntries.pick2 !== pick2.entries ||
    syncedEntries.blacklist !== blacklist.entries ||
    syncedEntries.isSaving !== isSaving
  ) {
    setSyncedEntries({
      pick1: pick1.entries,
      pick2: pick2.entries,
      blacklist: blacklist.entries,
      isSaving,
    });
    if (!isSaving && (pick1.picklist || pick2.picklist)) {
      setLocalPick1Order(toSortableItems(pick1.entries));
      setLocalPick2Order(toSortableItems(pick2.entries));
      setLocalBlacklistOrder(toSortableItems(blacklist.entries));
      setHasUnsavedChanges(false);
    }
  }

  // Recompute unlisted teams whenever picks or event teams change
  const [unlistedSource, setUnlistedSource] = useState<{
    allEventTeams: typeof allEventTeams;
    localPick1Order: SortableTeamItem[];
    localPick2Order: SortableTeamItem[];
    localBlacklistOrder: SortableTeamItem[];
    ownTeamNumber: typeof ownTeamNumber;
    qualRankings: typeof qualRankings;
  } | null>(null);
  if (
    unlistedSource === null ||
    unlistedSource.allEventTeams !== allEventTeams ||
    unlistedSource.localPick1Order !== localPick1Order ||
    unlistedSource.localPick2Order !== localPick2Order ||
    unlistedSource.localBlacklistOrder !== localBlacklistOrder ||
    unlistedSource.ownTeamNumber !== ownTeamNumber ||
    unlistedSource.qualRankings !== qualRankings
  ) {
    setUnlistedSource({
      allEventTeams,
      localPick1Order,
      localPick2Order,
      localBlacklistOrder,
      ownTeamNumber,
      qualRankings,
    });

    const pick1TeamNumbers = new Set(localPick1Order.map((e) => e.teamNumber));
    const pick2TeamNumbers = new Set(localPick2Order.map((e) => e.teamNumber));
    const blacklistTeamNumbers = new Set(
      localBlacklistOrder.map((e) => e.teamNumber),
    );

    const unlisted = allEventTeams
      .filter(
        (team) =>
          team.teamNumber !== ownTeamNumber &&
          !pick1TeamNumbers.has(team.teamNumber) &&
          !pick2TeamNumbers.has(team.teamNumber) &&
          !blacklistTeamNumbers.has(team.teamNumber),
      )
      .map((team) => ({
        id: String(team.teamNumber),
        teamNumber: team.teamNumber,
        qualRanking: qualRankings.get(team.teamNumber) ?? 999,
      }))
      .sort((a, b) => a.qualRanking - b.qualRanking);

    setLocalUnlisted(unlisted);
  }

  // Fetch qualification rankings from dedicated TBA endpoint (always returns real qual rankings)
  useEffect(() => {
    const fetchQualRankings = async () => {
      try {
        const params = new URLSearchParams({
          eventCode,
          competitionType,
          year: year.toString(),
        });
        const response = await fetch(
          `/api/events/${encodeURIComponent(eventCode)}/rankings?${params}`,
        );
        if (response.ok) {
          const data: RankingBlockResponse | RankingBlockResponse[] =
            await response.json();
          const qualMap = new Map<number, number>();
          // TBA returns [{ rankings: [{ team_key, rank, ... }] }]
          const rankingBlock = Array.isArray(data) ? data[0] : data;
          const rankingItems = rankingBlock?.rankings || [];
          rankingItems.forEach((item) => {
            const teamNumber = parseInt(
              String(item.team_key).replace(/^frc/i, ""),
              10,
            );
            if (!isNaN(teamNumber)) {
              qualMap.set(teamNumber, item.rank);
            }
          });
          if (qualMap.size > 0) {
            setQualRankings(qualMap);
          }
        }
      } catch (error) {
        console.error("Error fetching qual rankings:", error);
      }
    };
    fetchQualRankings();
  }, [eventCode, year, competitionType]);

  // Fetch EPA data from picklist API (uses local scouting data)
  const { config } = useGameConfig();
  const scoringConfigKey = JSON.stringify(config[competitionType]?.[year]);
  useEffect(() => {
    let cancelled = false;
    const fetchEpaData = async () => {
      try {
        const params = new URLSearchParams({
          eventCode,
          year: year.toString(),
          competitionType,
        });
        const response = await fetch(`/api/scouting/picklist?${params}`);
        if (response.ok) {
          const data: { teams?: PicklistTeamResponse[] } =
            await response.json();
          const epaMap = new Map<number, TeamEPAData>();
          if (data.teams && Array.isArray(data.teams)) {
            data.teams.forEach((team) => {
              epaMap.set(team.teamNumber, {
                totalEPA: team.totalEPA ?? 0,
                autoEPA: team.autoEPA ?? 0,
                teleopEPA: team.teleopEPA ?? 0,
                endgameEPA: team.endgameEPA ?? 0,
              });
            });
          }
          if (!cancelled) {
            setEpaData(epaMap);
          }
        }
      } catch (error) {
        console.error("Error fetching EPA data:", error);
      }
    };
    fetchEpaData();
    return () => { cancelled = true; };
  }, [eventCode, year, competitionType, scoringConfigKey]);

  // Load notes from database when picklists are ready
  useEffect(() => {
    if (notesLoadedRef.current) return;
    const picklistId =
      pick1.picklist?.id || pick2.picklist?.id || blacklist.picklist?.id;
    if (!picklistId) return;

    const loadNotes = async () => {
      try {
        const loaded: Record<number, string> = {};
        if (picklistId) {
          const res = await fetch(
            `/api/scouting/picklist/notes?picklistId=${picklistId}`,
          );
          if (res.ok) {
            const data: { notes?: PicklistNoteResponse[] } = await res.json();
            if (data.notes && Array.isArray(data.notes)) {
              data.notes.forEach((n) => {
                const content = n.note || "";
                if (content) loaded[n.teamNumber] = content;
              });
            }
          }
        }
        setTeamNotes((prev) => ({ ...prev, ...loaded }));
        notesLoadedRef.current = true;
      } catch (error) {
        console.error("Error loading notes:", error);
      }
    };
    loadNotes();
  }, [pick1.picklist?.id, pick2.picklist?.id, blacklist.picklist?.id]);

  // Initialize picklists if needed
  const initializePicklists = useCallback(async () => {
    try {
      const initTasks: Promise<unknown>[] = [];
      if (!pick1.picklist) initTasks.push(pick1.createPicklist([]));
      if (!pick2.picklist) initTasks.push(pick2.createPicklist([]));
      if (!blacklist.picklist) initTasks.push(blacklist.createPicklist([]));

      if (initTasks.length === 0) return;
      await Promise.all(initTasks);
      toast.success("Picklists initialized - drag teams from Unlisted");
    } catch (error) {
      console.error("Failed to initialize picklists:", error);
      toast.error("Failed to initialize picklists");
    }
  }, [pick1, pick2, blacklist]);

  const totalEventTeams = allEventTeams.filter(
    (t) => t.teamNumber !== ownTeamNumber,
  ).length;

  const teamNameByNumber = useMemo(() => {
    return new Map(
      allEventTeams.map((team) => [team.teamNumber, team.nickname]),
    );
  }, [allEventTeams]);

  const totalTrackedTeams = useMemo(() => {
    const trackedTeams = new Set<number>();
    localPick1Order.forEach((e) => trackedTeams.add(e.teamNumber));
    localPick2Order.forEach((e) => trackedTeams.add(e.teamNumber));
    localBlacklistOrder.forEach((e) => trackedTeams.add(e.teamNumber));
    localUnlisted.forEach((e) => trackedTeams.add(e.teamNumber));
    return trackedTeams.size;
  }, [localPick1Order, localPick2Order, localBlacklistOrder, localUnlisted]);

  // Resolve which picklistId a team belongs to (pick1, pick2, or fallback)
  const resolvePicklistId = useCallback(
    (teamNumber: number): number | undefined => {
      if (localPick1Ref.current.some((e) => e.teamNumber === teamNumber)) {
        return pick1IdRef.current;
      }
      if (localPick2Ref.current.some((e) => e.teamNumber === teamNumber)) {
        return pick2IdRef.current;
      }
      if (localBlacklistRef.current.some((e) => e.teamNumber === teamNumber)) {
        return blacklistIdRef.current;
      }
      // Unlisted teams: use whichever picklist exists
      return pick1IdRef.current ?? pick2IdRef.current;
    },
    [],
  );

  // Auto-save note to database with debounce
  // Uses refs so the debounced timer always reads the latest values
  const handleNoteChange = useCallback(
    (teamNumber: number, value: string) => {
      setTeamNotes((prev) => ({ ...prev, [teamNumber]: value }));

      // Clear any pending save for this team
      if (noteSaveTimersRef.current[teamNumber]) {
        clearTimeout(noteSaveTimersRef.current[teamNumber]);
      }

      noteSaveTimersRef.current[teamNumber] = setTimeout(async () => {
        // Resolve picklistId at fire time from refs (always fresh)
        const picklistId = resolvePicklistId(teamNumber);
        if (!picklistId) {
          console.warn(
            "Cannot save note: no picklist ID available for team",
            teamNumber,
          );
          return;
        }

        try {
          if (value.trim()) {
            const res = await fetch("/api/scouting/picklist/notes", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ picklistId, teamNumber, note: value }),
            });
            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              console.error("Failed to save note:", res.status, errData);
              toast.error("Failed to save note");
            }
          } else {
            const res = await fetch(
              `/api/scouting/picklist/notes?picklistId=${picklistId}&teamNumber=${teamNumber}`,
              { method: "DELETE" },
            );
            if (!res.ok) {
              console.error("Failed to delete note:", res.status);
            }
          }
        } catch (error) {
          console.error("Error saving note:", error);
          toast.error("Failed to save note");
        }
      }, 800);
    },
    [resolvePicklistId],
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const pick1Data = localPick1Order.map((e, idx) => ({
        teamNumber: e.teamNumber,
        rank: idx + 1,
      }));
      const pick2Data = localPick2Order.map((e, idx) => ({
        teamNumber: e.teamNumber,
        rank: idx + 1,
      }));
      const blacklistData = localBlacklistOrder.map((e, idx) => ({
        teamNumber: e.teamNumber,
        rank: idx + 1,
      }));

      await Promise.all([
        pick1.updatePicklistOrder(pick1Data),
        pick2.updatePicklistOrder(pick2Data),
        blacklist.updatePicklistOrder(blacklistData),
      ]);

      await Promise.all([
        pick1.fetchExistingPicklist(),
        pick2.fetchExistingPicklist(),
        blacklist.fetchExistingPicklist(),
      ]);

      setHasUnsavedChanges(false);
      toast.success("Picklist saved successfully");
    } catch (error) {
      console.error("Failed to save picklist:", error);
      toast.error("Failed to save picklist");
    } finally {
      setIsSaving(false);
    }
  }, [
    localPick1Order,
    localPick2Order,
    localBlacklistOrder,
    pick1,
    pick2,
    blacklist,
  ]);

  const confirmReset = useCallback(async () => {
    try {
      await pick1.deletePicklist();
      await pick2.deletePicklist();
      await blacklist.deletePicklist();
      setLocalPick1Order([]);
      setLocalPick2Order([]);
      setLocalBlacklistOrder([]);
      setHasUnsavedChanges(false);
      notesLoadedRef.current = false;
      setShowResetDialog(false);
      toast.success("Picklists reset - click Initialize to start fresh");
    } catch (error) {
      console.error("Failed to reset picklists:", error);
      setShowResetDialog(false);
    }
  }, [pick1, pick2, blacklist]);

  const toggleTeamExpanded = (teamNumber: number) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamNumber)) next.delete(teamNumber);
      else next.add(teamNumber);
      return next;
    });
  };

  // ── SortableJS handlers ──
  const handlePick1Change = useCallback((newState: SortableTeamItem[]) => {
    setLocalPick1Order(newState);
    setHasUnsavedChanges(true);
  }, []);

  const handlePick2Change = useCallback((newState: SortableTeamItem[]) => {
    setLocalPick2Order(newState);
    setHasUnsavedChanges(true);
  }, []);

  type PickListType = "1stPick" | "2ndPick" | "Unlisted";

  const moveTeam = useCallback(
    (teamNumber: number, from: PickListType, to: PickListType) => {
      const remove = (list: SortableTeamItem[]) =>
        list.filter((t) => t.teamNumber !== teamNumber);

      const team: SortableTeamItem = { id: String(teamNumber), teamNumber };

      if (from === "1stPick") setLocalPick1Order((l) => remove(l));
      if (from === "2ndPick") setLocalPick2Order((l) => remove(l));
      if (from === "Unlisted") setLocalUnlisted((l) => remove(l));

      if (to === "1stPick") setLocalPick1Order((l) => [...l, team]);
      if (to === "2ndPick") setLocalPick2Order((l) => [...l, team]);
      if (to === "Unlisted") setLocalUnlisted((l) => [...l, team]);

      setHasUnsavedChanges(true);
    },
    [],
  );

  //helper method to remove a team from all lists
  const removeTeamFromAllLists = (teamNumber: number) => {
    setLocalPick1Order((prev) =>
      prev.filter((t) => t.teamNumber !== teamNumber),
    );
    setLocalPick2Order((prev) =>
      prev.filter((t) => t.teamNumber !== teamNumber),
    );
    setLocalUnlisted((prev) => prev.filter((t) => t.teamNumber !== teamNumber));
    setLocalBlacklistOrder((prev) =>
      prev.filter((t) => t.teamNumber !== teamNumber),
    );
  };

  // ── Team row renderer ──
  const fmt = (v?: number) => (v === undefined ? "—" : v.toFixed(1));
  const renderTeamCard = (
    teamNumber: number,
    rank: number | null,
    listType: PickListType,
    blacklisted: boolean,
    compact = false,
  ) => {
    const isExpanded = expandedTeams.has(teamNumber);
    const qualRank = qualRankings.get(teamNumber);
    const epa = epaData.get(teamNumber);
    const teamName = teamNameByNumber.get(teamNumber) || `Team ${teamNumber}`;

    return (
      <div key={teamNumber} data-id={String(teamNumber)}>
        <Collapsible
          open={isExpanded}
          onOpenChange={() => toggleTeamExpanded(teamNumber)}
        >
          <div className={`border-b border-border/60 ${rank === 1 && listType === "1stPick" ? "bg-accent" : ""}`}>
            <div className="flex w-full items-center gap-2.5 py-2 tabular-nums">
              <button
                type="button"
                aria-label={`Drag to reorder ${teamNumber}`}
                className="sortable-handle flex-shrink-0 cursor-grab rounded p-1 text-muted-foreground active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4" />
              </button>
              {rank !== null && (
                <span className="w-6 flex-shrink-0 font-mono text-xs text-muted-foreground">
                  {String(rank).padStart(2, "0")}
                </span>
              )}
              <b className={`text-[17px] tracking-tight ${blacklisted ? "text-muted-foreground line-through" : ""}`}>
                {teamNumber}
              </b>
              <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                {blacklisted ? "Do not pick" : teamName}
              </span>
              {!compact && (
                <span className="hidden gap-4 font-mono text-sm sm:flex">
                  <span className="w-12 text-right" title="Auto EPA">{fmt(epa?.autoEPA)}</span>
                  <span className="w-12 text-right" title="Teleop EPA">{fmt(epa?.teleopEPA)}</span>
                  <span className="w-12 text-right" title="Endgame EPA">{fmt(epa?.endgameEPA)}</span>
                </span>
              )}
              <span className="w-12 text-right font-mono text-sm font-medium" title="EPA">{fmt(epa?.totalEPA)}</span>
              {!compact && (
                <span className="hidden w-9 text-right font-mono text-xs text-muted-foreground md:inline" title="Qualification rank">
                  {qualRank !== undefined ? `R${qualRank}` : ""}
                </span>
              )}
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  aria-label={`${isExpanded ? "Hide" : "Show"} details for ${teamNumber}`}
                  className="flex-shrink-0 cursor-pointer rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent>
              <div className="space-y-3 pb-4 pl-9 pr-1">
                <div className="grid grid-cols-2 border-t sm:grid-cols-4">
                  {[
                    ["Team", teamName],
                    ["Auto", fmt(epa?.autoEPA)],
                    ["Teleop", fmt(epa?.teleopEPA)],
                    ["Endgame", fmt(epa?.endgameEPA)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex flex-col border-b border-border/60 py-2.5">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <b className="truncate font-semibold">{value}</b>
                    </div>
                  ))}
                </div>
                <label className="flex flex-col gap-1 text-sm text-muted-foreground">
                  Notes
                  <Textarea
                    value={teamNotes[teamNumber] || ""}
                    onChange={(e) =>
                      handleNoteChange(teamNumber, e.target.value)
                    }
                    placeholder="Add notes about this team..."
                    className="min-h-20 bg-card text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="text-xs">Auto-saves after you stop typing</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {listType !== "1stPick" && (
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => moveTeam(teamNumber, listType, "1stPick")}>
                      Set 1st pick
                    </Button>
                  )}
                  {listType !== "2ndPick" && competitionType === "FRC" && (
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => moveTeam(teamNumber, listType, "2ndPick")}>
                      Set 2nd pick
                    </Button>
                  )}
                  {listType !== "Unlisted" && (
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => moveTeam(teamNumber, listType, "Unlisted")}>
                      Set unlisted
                    </Button>
                  )}
                  {!blacklisted ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="rounded-full"
                      onClick={() => {
                        removeTeamFromAllLists(teamNumber);
                        setLocalBlacklistOrder((prev) => [
                          ...prev,
                          {
                            id: String(teamNumber),
                            teamNumber,
                            isBlacklisted: true,
                          },
                        ]);
                        setHasUnsavedChanges(true);
                      }}
                    >
                      Do not pick
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="rounded-full"
                      onClick={() => {
                        removeTeamFromAllLists(teamNumber);
                        setLocalUnlisted((prev) => [
                          ...prev,
                          {
                            id: String(teamNumber),
                            teamNumber,
                            isBlacklisted: false,
                          },
                        ]);
                        setHasUnsavedChanges(true);
                      }}
                    >
                      Allow picking
                    </Button>
                  )}
                  <Button asChild size="sm" variant="ghost" className="rounded-full">
                    <Link href={`/dashboard/team/${teamNumber}`}>Open team page →</Link>
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>
    );
  };

  const header = (actions: ReactNode, notStarted = false) => (
    <header className="flex flex-wrap items-end justify-between gap-5">
      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs text-muted-foreground">
          picklist · {competitionType} · {eventCode}
        </span>
        <h1 className="text-[44px] font-bold leading-[0.95] tracking-[-0.04em]">Picklist</h1>
        <span className="text-muted-foreground">
          {notStarted
            ? `Not started · ${totalEventTeams} teams at this event`
            : `${totalTrackedTeams} of ${totalEventTeams} teams ranked · excluding ${ownTeamNumber}`}
        </span>
      </div>
      {actions}
    </header>
  );

  // ── Loading state ──
  if (pick1.isLoading || pick2.isLoading || blacklist.isLoading) {
    return (
      <div className="flex flex-col gap-9">
        {header(null)}
        <p className="py-8 text-center text-muted-foreground">Loading picklists...</p>
      </div>
    );
  }

  const showInitialize =
    !pick1.picklist && !pick2.picklist && !blacklist.picklist;

  const sortableGroupOptions = {
    name: "picklist",
    pull: true as const,
    put: true as const,
  };
  const sortableProps = {
    group: sortableGroupOptions,
    animation: 200,
    handle: ".sortable-handle",
    filter: "textarea,input",
    preventOnFilter: false,
    ghostClass: "opacity-30",
    dragClass: "shadow-lg",
    scroll: true,
    scrollSpeed: 20,
    scrollSensitivity: 100,
  };

  const combinedUnlisted: SortableTeamItem[] = [
    ...localUnlisted.map((item) => ({ ...item, isBlacklisted: false })),
    ...localBlacklistOrder.map((item) => ({ ...item, isBlacklisted: true })),
  ];

  const isFrc = competitionType === "FRC";
  const showingSecond = isFrc && activeList === "2ndPick";
  const activeItems = showingSecond ? localPick2Order : localPick1Order;

  // Projected alliance: us, then the top of each pick list.
  const captain = epaData.get(ownTeamNumber);
  const picks = [localPick1Order[0], isFrc ? localPick2Order[0] : undefined]
    .filter((p): p is SortableTeamItem => !!p)
    .map((p) => p.teamNumber);
  const allianceTeams = [ownTeamNumber, ...picks];
  const sum = (key: keyof TeamEPAData) =>
    allianceTeams.reduce((total, team) => total + (epaData.get(team)?.[key] ?? 0), 0);
  const projected = [
    { l: "Projected alliance", v: sum("totalEPA").toFixed(1), s: "combined EPA" },
    { l: "Auto", v: sum("autoEPA").toFixed(1), s: "EPA" },
    { l: "Teleop", v: sum("teleopEPA").toFixed(1), s: "EPA" },
    { l: "Endgame", v: sum("endgameEPA").toFixed(1), s: "EPA" },
  ];

  const tab = (value: PickListType, label: string) => (
    <Button
      size="sm"
      variant={activeList === value ? "default" : "ghost"}
      className="rounded-full"
      aria-pressed={activeList === value}
      onClick={() => setActiveList(value)}
    >
      {label}
    </Button>
  );

  // ── Render ──
  return (
    <div className="flex flex-col gap-9">
      {header(
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            {showInitialize ? (
              <Button className="h-10 rounded-full px-4" onClick={initializePicklists}>
                <Plus className="h-4 w-4" />
                Initialize picklist
              </Button>
            ) : (
              <>
                <Button variant="outline" className="h-10 rounded-full px-4" onClick={() => setShowResetDialog(true)}>
                  <Trash2 className="h-4 w-4" />
                  Reset
                </Button>
                <Button className="h-10 rounded-full px-4" onClick={handleSave} disabled={!hasUnsavedChanges || isSaving}>
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save changes"}
                </Button>
              </>
            )}
          </div>
          {!showInitialize && hasUnsavedChanges && (
            <span className="text-sm font-medium text-destructive">You have unsaved changes</span>
          )}
        </div>,
        showInitialize,
      )}

      {showInitialize && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">No picklist for this event yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Initialize it to get empty first-pick and second-pick lists, then drag teams in from Unlisted.
          </p>
        </div>
      )}

      {!showInitialize && (
        <>
          <section aria-labelledby="alliance" className="flex flex-wrap items-stretch gap-3">
            <h2 id="alliance" className="sr-only">Projected alliance</h2>
            {allianceTeams.map((team, i) => (
              <div
                key={team}
                className={`flex flex-[1_1_150px] flex-col gap-0.5 rounded-xl px-4 py-3.5 ${i === 0 ? "bg-primary text-primary-foreground" : "border bg-card"}`}
              >
                <span className={`text-xs ${i === 0 ? "" : "text-muted-foreground"}`}>{i === 0 ? "Captain" : `Pick ${i}`}</span>
                <span className="text-[30px] font-bold tracking-[-0.03em]">{team}</span>
                <span className="font-mono text-xs">{fmt((i === 0 ? captain : epaData.get(team))?.totalEPA)} EPA</span>
              </div>
            ))}
            {projected.map((k) => (
              <div key={k.l} className="flex flex-[1_1_120px] flex-col gap-0.5 border-l py-3.5 pl-4">
                <span className="text-xs text-muted-foreground">{k.l}</span>
                <span className="text-[30px] font-semibold tracking-[-0.03em]">{k.v}</span>
                <span className="font-mono text-xs text-muted-foreground">{k.s}</span>
              </div>
            ))}
          </section>

          <div className="flex flex-wrap items-start gap-10">
            <section aria-labelledby="ranked" className="flex min-w-0 flex-[3_1_560px] flex-col">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-1.5">
                <h2 id="ranked" className="text-lg font-semibold tracking-tight">
                  {showingSecond ? "Second pick" : "First pick"} · {activeItems.length}
                </h2>
                {isFrc && (
                  <div role="group" aria-label="List" className="flex gap-1">
                    {tab("1stPick", "First pick")}
                    {tab("2ndPick", "Second pick")}
                  </div>
                )}
              </div>
              <div className="flex gap-2.5 border-b py-2 pl-9 pr-8 text-xs text-muted-foreground tabular-nums">
                <span className="w-6" />
                <span className="flex-1">Team</span>
                <span className="hidden gap-4 sm:flex">
                  <span className="w-12 text-right">Auto</span>
                  <span className="w-12 text-right">Teleop</span>
                  <span className="w-12 text-right">Endgame</span>
                </span>
                <span className="w-12 text-right">EPA</span>
                <span className="hidden w-9 text-right md:inline">Rank</span>
              </div>
              <div className="relative">
              {showingSecond ? (
                <ReactSortable key="2ndPick" list={localPick2Order} setList={handlePick2Change} {...sortableProps} className="min-h-48">
                  {localPick2Order.map((item, idx) => renderTeamCard(item.teamNumber, idx + 1, "2ndPick", false))}
                </ReactSortable>
              ) : (
                <ReactSortable key="1stPick" list={localPick1Order} setList={handlePick1Change} {...sortableProps} className="min-h-48">
                  {localPick1Order.map((item, idx) => renderTeamCard(item.teamNumber, idx + 1, "1stPick", false))}
                </ReactSortable>
              )}
              {activeItems.length === 0 && (
                <p className="pointer-events-none absolute inset-x-0 top-12 text-center text-muted-foreground">Drag teams here</p>
              )}
              </div>
            </section>

            <aside aria-labelledby="pool" className="flex min-w-0 flex-[2_1_300px] flex-col">
              <h2 id="pool" className="pb-1.5 text-lg font-semibold tracking-tight">
                Unlisted · {localUnlisted.length}
              </h2>
              <p className="border-b pb-2 text-sm text-muted-foreground">
                Drag a team into the list, or open it to move it.
              </p>
              <div className="relative">
              <ReactSortable
                list={combinedUnlisted}
                setList={(newState) => {
                  // Split back out after drag
                  const newUnlisted: SortableTeamItem[] = [];
                  const newBlacklist: SortableTeamItem[] = [];

                  const seen = new Set<number>();

                  newState.forEach((item) => {
                    if (seen.has(item.teamNumber)) return;
                    seen.add(item.teamNumber);

                    if (item.isBlacklisted) newBlacklist.push(item);
                    else newUnlisted.push(item);
                  });

                  setLocalUnlisted(newUnlisted);
                  setLocalBlacklistOrder(newBlacklist);

                  setHasUnsavedChanges(true);
                }}
                {...sortableProps}
                className="min-h-48"
              >
                {combinedUnlisted.map((item) =>
                  renderTeamCard(item.teamNumber, null, "Unlisted", item.isBlacklisted ?? false, true),
                )}
              </ReactSortable>
              {combinedUnlisted.length === 0 && (
                <p className="pointer-events-none absolute inset-x-0 top-12 text-center text-muted-foreground">
                  {isEventTeamsLoading ? "Loading event teams..." : "All teams assigned"}
                </p>
              )}
              </div>
            </aside>
          </div>
        </>
      )}

      <DeleteConfirmationDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        onConfirm={confirmReset}
        title="Reset Picklist"
        description="Are you sure you want to reset the picklist? This will delete all current picks and start fresh."
        confirmButtonText="Reset"
        loadingText="Resetting..."
      />
    </div>
  );
}
