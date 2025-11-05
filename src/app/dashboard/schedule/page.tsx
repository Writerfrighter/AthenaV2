'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar, Clock, Users, Handshake, Loader2, AlertCircle } from "lucide-react"
import { useScheduleData } from '@/hooks/use-schedule-data'
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { ScoutingBlockWithAssignments } from '@/lib/shared-types'

// Define extended user type with preferred partners
interface UserWithPartners {
  id: string
  name: string
  username: string
  role: string
  preferredPartners: string[]
}

// Define display block type for UI
interface DisplayBlock {
  id: number
  name: string
  matches: number[]
  redScouts: (string | null)[]
  blueScouts: (string | null)[]
}


export default function SchedulePage() {
  const {
    users,
    blocks: dbBlocks,
    matchCount,
    isLoading,
    error,
    hasEvent,
    createBlocks,
    assignScout,
  } = useScheduleData()

  const [blockSize, setBlockSize] = useState(5)
  const [activeScouts, setActiveScouts] = useState<string[]>([])
  const [isCreatingBlocks, setIsCreatingBlocks] = useState(false)
  const [isAutoAssigning, setIsAutoAssigning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Local state for assignments (not synced to server until save)
  const [localBlocks, setLocalBlocks] = useState<DisplayBlock[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const mapBlocksToDisplay = useCallback((sourceBlocks: ScoutingBlockWithAssignments[]): DisplayBlock[] => {
    return sourceBlocks.map(block => ({
      id: block.id!,
      name: `Block ${block.blockNumber}`,
      matches: Array.from(
        { length: block.endMatch - block.startMatch + 1 },
        (_, i) => block.startMatch + i
      ),
      redScouts: [...block.redScouts],
      blueScouts: [...block.blueScouts],
    }))
  }, [])

  // Memoize the toggle function to prevent re-creating on each render
  const toggleActiveScout = useCallback((scoutId: string, checked: boolean) => {
    setActiveScouts(prev => {
      if (checked) {
        return [...prev, scoutId]
      } else {
        return prev.filter(id => id !== scoutId)
      }
    })
  }, [])

  // Convert database blocks to display blocks and update local state
  useEffect(() => {
    setLocalBlocks(mapBlocksToDisplay(dbBlocks))
    setHasUnsavedChanges(false)
  }, [dbBlocks, mapBlocksToDisplay])

  // Use local blocks for display
  const blocks = localBlocks

  const sortedUsers = useMemo<UserWithPartners[]>(() => {
    return [...users].sort((a, b) => a.name.localeCompare(b.name))
  }, [users])

  const usersById = useMemo(() => {
    return new Map(sortedUsers.map(user => [user.id, user]))
  }, [sortedUsers])

  const activeScoutSet = useMemo(() => new Set(activeScouts), [activeScouts])

  const sortedActiveUsers = useMemo<UserWithPartners[]>(() => {
    return sortedUsers.filter(user => activeScoutSet.has(user.id))
  }, [sortedUsers, activeScoutSet])

  const hasPreferredPartnerInBlock = useCallback((userId: string, block: DisplayBlock) => {
    const user = usersById.get(userId)
    if (!user || user.preferredPartners.length === 0) return false

    const assignedScouts = new Set<string>([
      ...block.redScouts.filter((scout): scout is string => scout !== null),
      ...block.blueScouts.filter((scout): scout is string => scout !== null),
    ])

    return user.preferredPartners.some(partnerId => assignedScouts.has(partnerId))
  }, [usersById])

  const getPairedPartnersInBlock = useCallback((userId: string, block: DisplayBlock) => {
    const user = usersById.get(userId)
    if (!user || user.preferredPartners.length === 0) return []

    const assignedScouts = new Set<string>([
      ...block.redScouts.filter((scout): scout is string => scout !== null),
      ...block.blueScouts.filter((scout): scout is string => scout !== null),
    ])

    return user.preferredPartners.filter(partnerId => assignedScouts.has(partnerId))
  }, [usersById])

  const computeUserWorkload = useCallback((targetBlocks: DisplayBlock[]) => {
    const workload = new Map<string, number>()
    sortedUsers.forEach(user => workload.set(user.id, 0))

    targetBlocks.forEach(block => {
      block.redScouts.forEach(scoutId => {
        if (scoutId) {
          workload.set(scoutId, (workload.get(scoutId) ?? 0) + 1)
        }
      })
      block.blueScouts.forEach(scoutId => {
        if (scoutId) {
          workload.set(scoutId, (workload.get(scoutId) ?? 0) + 1)
        }
      })
    })

    return workload
  }, [sortedUsers])

  const workloadMap = useMemo(() => computeUserWorkload(blocks), [blocks, computeUserWorkload])

  const scheduleSummary = useMemo(() => {
    let totalAssigned = 0
    let unassigned = 0
    let preferredPairHits = 0
    const assignedScoutIds = new Set<string>()

    blocks.forEach(block => {
      const positions = [...block.redScouts, ...block.blueScouts]
      positions.forEach(scoutId => {
        if (scoutId) {
          totalAssigned++
          assignedScoutIds.add(scoutId)
          if (hasPreferredPartnerInBlock(scoutId, block)) {
            preferredPairHits++
          }
        } else {
          unassigned++
        }
      })
    })

    return {
      totalAssigned,
      unassigned,
      activeAssignedCount: assignedScoutIds.size,
      preferredPairings: Math.floor(preferredPairHits / 2),
    }
  }, [blocks, hasPreferredPartnerInBlock])

  const workloadList = useMemo(() => {
    return sortedUsers
      .map(user => ({
        user,
        blocksAssigned: workloadMap.get(user.id) ?? 0,
        isActive: activeScoutSet.has(user.id),
      }))
      .sort((a, b) => b.blocksAssigned - a.blocksAssigned)
  }, [sortedUsers, workloadMap, activeScoutSet])

  const assignBlockScout = async (blockId: number, alliance: 'red' | 'blue', scoutIndex: number, scoutId: string | null) => {
    // Update local state only (no network call)
    setLocalBlocks(prevBlocks => {
      return prevBlocks.map(block => {
        if (block.id !== blockId) return block
        
        const updatedBlock = { ...block }
        if (alliance === 'red') {
          updatedBlock.redScouts = [...block.redScouts]
          updatedBlock.redScouts[scoutIndex] = scoutId
        } else {
          updatedBlock.blueScouts = [...block.blueScouts]
          updatedBlock.blueScouts[scoutIndex] = scoutId
        }
        return updatedBlock
      })
    })
    setHasUnsavedChanges(true)
  }

  const saveAllChanges = async () => {
    setIsSaving(true)
    try {
      // Compare local blocks with db blocks to find changes
      const assignmentsToMake: Array<{
        blockId: number
        userId: string | null
        alliance: 'red' | 'blue'
        position: number
      }> = []

      localBlocks.forEach(localBlock => {
        const dbBlock = dbBlocks.find(b => b.id === localBlock.id)
        if (!dbBlock) return

        // Check red scouts
        localBlock.redScouts.forEach((scoutId, index) => {
          if (scoutId !== dbBlock.redScouts[index]) {
            assignmentsToMake.push({
              blockId: localBlock.id,
              userId: scoutId,
              alliance: 'red',
              position: index
            })
          }
        })

        // Check blue scouts
        localBlock.blueScouts.forEach((scoutId, index) => {
          if (scoutId !== dbBlock.blueScouts[index]) {
            assignmentsToMake.push({
              blockId: localBlock.id,
              userId: scoutId,
              alliance: 'blue',
              position: index
            })
          }
        })
      })

      // Execute all assignments in parallel batches
      const batchSize = 20
      for (let i = 0; i < assignmentsToMake.length; i += batchSize) {
        const batch = assignmentsToMake.slice(i, i + batchSize)
        await Promise.all(
          batch.map(assignment => 
            assignScout(assignment.blockId, assignment.userId, assignment.alliance, assignment.position)
          )
        )
      }

      setHasUnsavedChanges(false)
    } catch (err) {
      console.error('Error saving changes:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const discardChanges = () => {
    setLocalBlocks(mapBlocksToDisplay(dbBlocks))
    setHasUnsavedChanges(false)
  }

  const getAssignedScoutForSlot = useCallback((block: DisplayBlock, alliance: 'red' | 'blue', scoutIndex: number): UserWithPartners | null => {
    const scoutId = alliance === 'red' ? block.redScouts[scoutIndex] : block.blueScouts[scoutIndex]
    return scoutId ? usersById.get(scoutId) ?? null : null
  }, [usersById])

  const getAvailableUsersForSlot = useCallback((block: DisplayBlock, alliance: 'red' | 'blue', scoutIndex: number): UserWithPartners[] => {
    const assignedIds = new Set<string>()

    block.redScouts.forEach((scoutId, index) => {
      if (scoutId && !(alliance === 'red' && index === scoutIndex)) {
        assignedIds.add(scoutId)
      }
    })

    block.blueScouts.forEach((scoutId, index) => {
      if (scoutId && !(alliance === 'blue' && index === scoutIndex)) {
        assignedIds.add(scoutId)
      }
    })

    return sortedActiveUsers.filter(user => !assignedIds.has(user.id))
  }, [sortedActiveUsers])

  const autoAssignBlockScouts = useCallback(() => {
    setIsAutoAssigning(true)
    let didModify = false

    try {
      setLocalBlocks(prevBlocks => {
        const draftBlocks = prevBlocks.map(block => ({
          ...block,
          redScouts: [...block.redScouts],
          blueScouts: [...block.blueScouts],
        }))

        if (sortedActiveUsers.length === 0) {
          return draftBlocks
        }

        const workload = computeUserWorkload(draftBlocks)

        const wasAssignedToPreviousBlock = (scoutId: string, blockIndex: number) => {
          if (blockIndex <= 0) return false
          const previousBlock = draftBlocks[blockIndex - 1]
          return [...previousBlock.redScouts, ...previousBlock.blueScouts].includes(scoutId)
        }

        draftBlocks.forEach((block, blockIndex) => {
          const assignAlliance = (alliance: 'red' | 'blue') => {
            const currentScouts = alliance === 'red' ? block.redScouts : block.blueScouts
            const assignedInBlock = new Set<string>([
              ...block.redScouts.filter((id): id is string => id !== null),
              ...block.blueScouts.filter((id): id is string => id !== null),
            ])

            for (let slotIndex = 0; slotIndex < currentScouts.length; slotIndex++) {
              if (currentScouts[slotIndex]) continue

              let bestCandidate: UserWithPartners | null = null
              let bestScore: [number, number, number, number] | null = null

              for (let candidateIndex = 0; candidateIndex < sortedActiveUsers.length; candidateIndex++) {
                const candidate = sortedActiveUsers[candidateIndex]
                if (assignedInBlock.has(candidate.id)) continue

                const backToBack = wasAssignedToPreviousBlock(candidate.id, blockIndex) ? 1 : 0
                const workloadValue = workload.get(candidate.id) ?? 0
                const preferredPartnerScore = hasPreferredPartnerInBlock(candidate.id, block) ? 0 : 1
                const score: [number, number, number, number] = [
                  backToBack,
                  workloadValue,
                  preferredPartnerScore,
                  candidateIndex,
                ]

                if (
                  !bestScore ||
                  score[0] < bestScore[0] ||
                  (score[0] === bestScore[0] && score[1] < bestScore[1]) ||
                  (score[0] === bestScore[0] && score[1] === bestScore[1] && score[2] < bestScore[2]) ||
                  (score[0] === bestScore[0] && score[1] === bestScore[1] && score[2] === bestScore[2] && score[3] < bestScore[3])
                ) {
                  bestScore = score
                  bestCandidate = candidate
                }
              }

              if (bestCandidate) {
                const candidateId = bestCandidate.id
                currentScouts[slotIndex] = candidateId
                assignedInBlock.add(candidateId)
                workload.set(candidateId, (workload.get(candidateId) ?? 0) + 1)
                didModify = true
              }
            }
          }

          assignAlliance('red')
          assignAlliance('blue')
        })

        return draftBlocks
      })
      setHasUnsavedChanges(prev => prev || didModify)
    } catch (err) {
      console.error('Error auto-assigning scouts:', err)
    } finally {
      setIsAutoAssigning(false)
    }
  }, [computeUserWorkload, hasPreferredPartnerInBlock, sortedActiveUsers])

  const clearAllBlockAssignments = useCallback(() => {
    setLocalBlocks(prevBlocks =>
      prevBlocks.map(block => ({
        ...block,
        redScouts: block.redScouts.map(() => null),
        blueScouts: block.blueScouts.map(() => null),
      }))
    )
    setHasUnsavedChanges(true)
  }, [])

  const assignNextBlockScout = useCallback(async (blockId: number, alliance: 'red' | 'blue', scoutIndex: number) => {
    const block = blocks.find(b => b.id === blockId)
    if (!block) return

    const availableUsers = getAvailableUsersForSlot(block, alliance, scoutIndex)
    if (availableUsers.length === 0) return

    const workload = computeUserWorkload(blocks)

    const sortedCandidates = [...availableUsers].sort((a, b) => {
      const workloadDiff = (workload.get(a.id) ?? 0) - (workload.get(b.id) ?? 0)
      if (workloadDiff !== 0) return workloadDiff

      const aHasPartner = hasPreferredPartnerInBlock(a.id, block)
      const bHasPartner = hasPreferredPartnerInBlock(b.id, block)
      if (aHasPartner !== bHasPartner) {
        return aHasPartner ? -1 : 1
      }

      return a.name.localeCompare(b.name)
    })

    const bestCandidate = sortedCandidates[0]
    if (bestCandidate) {
      await assignBlockScout(blockId, alliance, scoutIndex, bestCandidate.id)
    }
  }, [assignBlockScout, blocks, computeUserWorkload, getAvailableUsersForSlot, hasPreferredPartnerInBlock])

  const handleCreateBlocks = async () => {
    if (!matchCount) return
    
    setIsCreatingBlocks(true)
    try {
      await createBlocks(blockSize, matchCount)
    } catch (err) {
      console.error('Error creating blocks:', err)
    } finally {
      setIsCreatingBlocks(false)
    }
  }

  const handleReconfigureBlocks = async () => {
    if (!matchCount || !confirm('This will delete all existing blocks and assignments. Continue?')) return
    
    setIsCreatingBlocks(true)
    try {
      await createBlocks(blockSize, matchCount)
      setHasUnsavedChanges(false)
    } catch (err) {
      console.error('Error reconfiguring blocks:', err)
    } finally {
      setIsCreatingBlocks(false)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading schedule data...</p>
        </div>
      </div>
    )
  }

  // Show error if no event selected
  if (!hasEvent) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground">
            Assign scouts to blocks based on the specified block size.
          </p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select an event from the event switcher to view and manage the scouting schedule.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground">
            Assign scouts to blocks based on the specified block size. Each block contains a set number of qualification matches for efficient scouting coverage.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {hasUnsavedChanges && (
            <>
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                Unsaved Changes
              </Badge>
              <Button variant="outline" onClick={discardChanges} disabled={isSaving}>
                Discard
              </Button>
              <Button onClick={saveAllChanges} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </>
          )}
          {blocks.length === 0 && matchCount > 0 && (
            <>
              <div className="flex items-center gap-2">
                <label htmlFor="block-size" className="text-sm font-medium">Block Size:</label>
                <Select value={blockSize.toString()} onValueChange={(value) => setBlockSize(parseInt(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="6">6</SelectItem>
                    <SelectItem value="7">7</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="9">9</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateBlocks} disabled={isCreatingBlocks}>
                {isCreatingBlocks ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Blocks'
                )}
              </Button>
            </>
          )}
          {blocks.length > 0 && !hasUnsavedChanges && (
            <>
              <div className="flex items-center gap-2">
                <label htmlFor="block-size-reconfig" className="text-sm font-medium">Block Size:</label>
                <Select value={blockSize.toString()} onValueChange={(value) => setBlockSize(parseInt(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="6">6</SelectItem>
                    <SelectItem value="7">7</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="9">9</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={handleReconfigureBlocks} disabled={isCreatingBlocks}>
                  Reconfigure
                </Button>
              </div>
              <Button variant="outline" onClick={autoAssignBlockScouts} disabled={isAutoAssigning}>
                {isAutoAssigning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  'Auto-Assign Scouts'
                )}
              </Button>
              <Button variant="outline" onClick={clearAllBlockAssignments}>
                Clear All
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Show match count info */}
      {matchCount > 0 && blocks.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This event has {matchCount} qualification matches. Create scouting blocks to begin assigning scouts.
          </AlertDescription>
        </Alert>
      )}

      {matchCount === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No match data available for this event. Match count is needed to create scouting blocks.
          </AlertDescription>
        </Alert>
      )}

      {/* Active Scouts Selection */}
      {blocks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Active Scouts Selection
            </CardTitle>
            <CardDescription>
              Select scouts who will be available for scouting duties. Only selected scouts will be assigned to blocks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {sortedUsers.map(scout => (
                <div key={scout.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`active-${scout.id}`}
                    checked={activeScoutSet.has(scout.id)}
                    onCheckedChange={(checked) => toggleActiveScout(scout.id, checked === true)}
                  />
                  <label htmlFor={`active-${scout.id}`} className="text-sm font-medium cursor-pointer">
                    {scout.name}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Table */}
      {blocks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Scouting Schedule
            </CardTitle>
            <CardDescription>
              Assign scouts to blocks containing the specified number of matches. Scouts stay in position for their entire block.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {blocks.map((block) => (
                <div key={block.id} className="border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold">{block.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Matches: {block.matches.join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Red Alliance Scouts */}
                    <div>
                      <h4 className="font-medium text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 dark:bg-red-600 rounded"></div>
                        Red Alliance Scouts
                      </h4>
                      <div className="space-y-3">
                        {block.redScouts.map((_, scoutIndex) => {
                          const assignedScout = getAssignedScoutForSlot(block, 'red', scoutIndex)
                          const availableUsers = getAvailableUsersForSlot(block, 'red', scoutIndex)
                          const isPaired = assignedScout && hasPreferredPartnerInBlock(assignedScout.id, block)
                          const pairedPartners = assignedScout ? getPairedPartnersInBlock(assignedScout.id, block) : []

                          return (
                            <div key={scoutIndex} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                              <div className="flex items-center gap-3">
                                <span className="font-medium">Scout {scoutIndex + 1}</span>
                                {assignedScout && (
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      {assignedScout.name}
                                    </Badge>
                                    {isPaired && (
                                      <Badge 
                                        variant="outline" 
                                        className="flex items-center gap-1 text-green-700 dark:text-green-400 border-green-600 dark:border-green-500"
                                        title={`Paired with: ${pairedPartners.map(id => usersById.get(id)?.name).join(', ')}`}
                                      >
                                        <Handshake className="h-3 w-3" />
                                        Paired
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {!assignedScout && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => assignNextBlockScout(block.id, 'red', scoutIndex)}
                                    className="text-xs"
                                  >
                                    Quick Assign
                                  </Button>
                                )}
                                <Select
                                  value={assignedScout ? assignedScout.id : "none"}
                                  onValueChange={(value) => assignBlockScout(block.id, 'red', scoutIndex, value === "none" ? null : value)}
                                >
                                  <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Select scout" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                      {availableUsers.map((user) => (
                                      <SelectItem key={user.id} value={user.id}>
                                        {user.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Blue Alliance Scouts */}
                    <div>
                      <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 dark:bg-blue-600 rounded"></div>
                        Blue Alliance Scouts
                      </h4>
                      <div className="space-y-3">
                        {block.blueScouts.map((_, scoutIndex) => {
                          const assignedScout = getAssignedScoutForSlot(block, 'blue', scoutIndex)
                          const availableUsers = getAvailableUsersForSlot(block, 'blue', scoutIndex)
                          const isPaired = assignedScout && hasPreferredPartnerInBlock(assignedScout.id, block)
                          const pairedPartners = assignedScout ? getPairedPartnersInBlock(assignedScout.id, block) : []

                          return (
                            <div key={scoutIndex} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                              <div className="flex items-center gap-3">
                                <span className="font-medium">Scout {scoutIndex + 1}</span>
                                {assignedScout && (
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      {assignedScout.name}
                                    </Badge>
                                    {isPaired && (
                                      <Badge 
                                        variant="outline" 
                                        className="flex items-center gap-1 text-green-700 dark:text-green-400 border-green-600 dark:border-green-500"
                                        title={`Paired with: ${pairedPartners.map(id => usersById.get(id)?.name).join(', ')}`}
                                      >
                                        <Handshake className="h-3 w-3" />
                                        Paired
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {!assignedScout && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => assignNextBlockScout(block.id, 'blue', scoutIndex)}
                                    className="text-xs"
                                  >
                                    Quick Assign
                                  </Button>
                                )}
                                <Select
                                  value={assignedScout ? assignedScout.id : "none"}
                                  onValueChange={(value) => assignBlockScout(block.id, 'blue', scoutIndex, value === "none" ? null : value)}
                                >
                                  <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Select scout" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                      {availableUsers.map((user) => (
                                      <SelectItem key={user.id} value={user.id}>
                                        {user.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scout Workload Summary */}
      {blocks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Scout Workload Distribution
            </CardTitle>
            <CardDescription>
              Shows how many blocks each scout is assigned to (for fair distribution)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {workloadList.map(({ user, blocksAssigned, isActive }) => (
                <div key={user.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{user.name}</span>
                    {isActive && (
                      <Badge variant="default" className="text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                  <Badge variant={blocksAssigned > 0 ? "default" : "secondary"}>
                    {blocksAssigned} block{blocksAssigned !== 1 ? 's' : ''}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      {blocks.length > 0 && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Blocks</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{blocks.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned Scouts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scheduleSummary.totalAssigned}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unassigned Positions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scheduleSummary.unassigned}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Scouts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scheduleSummary.activeAssignedCount}</div>
              <p className="text-xs text-muted-foreground">
                Scouts assigned to blocks
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Preferred Pairings</CardTitle>
              <Handshake className="h-4 w-4 text-green-700 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">{scheduleSummary.preferredPairings}</div>
              <p className="text-xs text-muted-foreground">
                Scout pairs working together
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}