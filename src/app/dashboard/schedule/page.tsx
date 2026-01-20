'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, Users, Handshake, Loader2, AlertCircle, RefreshCw, ChevronRight, ChevronDown, RotateCcw } from "lucide-react"
import { useScheduleData } from '@/hooks/use-schedule-data'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import type { ScoutingBlockWithAssignments } from '@/lib/shared-types'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { hasPermission, PERMISSIONS } from '@/lib/auth/roles'

// User type with preferred partners
interface UserWithPartners {
  id: string
  name: string
  username: string
  role: string
  preferredPartners: string[]
}

// Display block type for UI
interface DisplayBlock {
  id: number
  name: string
  blockNumber: number
  matches: number[]
  redScouts: (string | null)[]
  blueScouts: (string | null)[]
}

// Memoized scout checkbox
const ActiveScoutCheckbox = React.memo(({
  scout,
  isActive,
  onToggle
}: {
  scout: UserWithPartners
  isActive: boolean
  onToggle: (scoutId: string, checked: boolean) => void
}) => (
  <div className="flex items-center space-x-2">
    <Checkbox
      id={`active-${scout.id}`}
      checked={isActive}
      onCheckedChange={(checked) => onToggle(scout.id, checked === true)}
    />
    <label htmlFor={`active-${scout.id}`} className="text-sm font-medium cursor-pointer">
      {scout.name}
    </label>
  </div>
))
ActiveScoutCheckbox.displayName = 'ActiveScoutCheckbox'

export default function SchedulePage() {
  const {
    users,
    blocks: dbBlocks,
    blockSize,
    setBlockSize,
    matchCount,
    setManualMatchCount,
    apiMatchCount,
    isApiMatchCountAvailable,
    competitionType,
    isLoading,
    error,
    hasEvent,
    generateBlocks,
    syncMatchCountFromApi,
    assignScout,
    clearAllAssignments,
    deleteAllBlocks,
    refreshData,
  } = useScheduleData()

  // Get session for permission checking
  const { data: session } = useSession()
  const canEditSchedule = useMemo(() => {
    const role = session?.user?.role ?? null
    return hasPermission(role, PERMISSIONS.CREATE_SCHEDULE) || hasPermission(role, PERMISSIONS.EDIT_SCHEDULE)
  }, [session?.user?.role])

  // UI state
  const [activeScouts, setActiveScouts] = useState<string[]>([])
  const [isGeneratingBlocks, setIsGeneratingBlocks] = useState(false)
  const [isAutoAssigning, setIsAutoAssigning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncingMatchCount, setIsSyncingMatchCount] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  
  // Form inputs
  const [manualMatchInput, setManualMatchInput] = useState<string>('')
  
  // Local state for assignments
  const [localBlocks, setLocalBlocks] = useState<DisplayBlock[]>([])
  // Track the last synced dbBlocks to detect when to reset local state
  const [lastSyncedDbBlocksRef, setLastSyncedDbBlocksRef] = useState<string>('')

  // Map DB blocks to display format
  const mapBlocksToDisplay = useCallback((sourceBlocks: ScoutingBlockWithAssignments[]): DisplayBlock[] => {
    return sourceBlocks.map(block => ({
      id: block.id!,
      name: `Shift ${block.blockNumber}`,
      blockNumber: block.blockNumber,
      matches: Array.from({ length: block.endMatch - block.startMatch + 1 }, (_, i) => block.startMatch + i),
      redScouts: [...block.redScouts],
      blueScouts: [...block.blueScouts],
    }))
  }, [])

  // Compute hasUnsavedChanges by comparing local blocks with DB blocks
  const hasUnsavedChanges = useMemo(() => {
    if (localBlocks.length !== dbBlocks.length) return false // Different structure means not comparable
    
    for (const localBlock of localBlocks) {
      const dbBlock = dbBlocks.find(b => b.id === localBlock.id)
      if (!dbBlock) return false // Block doesn't exist in DB yet
      
      // Compare red scouts
      for (let i = 0; i < localBlock.redScouts.length; i++) {
        if (localBlock.redScouts[i] !== dbBlock.redScouts[i]) return true
      }
      
      // Compare blue scouts
      for (let i = 0; i < localBlock.blueScouts.length; i++) {
        if (localBlock.blueScouts[i] !== dbBlock.blueScouts[i]) return true
      }
    }
    
    return false
  }, [localBlocks, dbBlocks])

  // Sync local blocks with DB blocks when DB blocks change (from external source)
  useEffect(() => {
    // Create a fingerprint of dbBlocks to detect actual changes
    const dbBlocksFingerprint = JSON.stringify(dbBlocks.map(b => ({
      id: b.id,
      red: b.redScouts,
      blue: b.blueScouts
    })))
    
    // Only sync if dbBlocks actually changed from what we last synced
    if (dbBlocksFingerprint !== lastSyncedDbBlocksRef) {
      setLocalBlocks(mapBlocksToDisplay(dbBlocks))
      setLastSyncedDbBlocksRef(dbBlocksFingerprint)
      
      // Auto-populate active scouts from existing assignments
      const assignedScoutIds = new Set<string>()
      dbBlocks.forEach(block => {
        block.redScouts.forEach(scoutId => {
          if (scoutId) assignedScoutIds.add(scoutId)
        })
        block.blueScouts.forEach(scoutId => {
          if (scoutId) assignedScoutIds.add(scoutId)
        })
      })
      setActiveScouts(Array.from(assignedScoutIds))
    }
  }, [dbBlocks, mapBlocksToDisplay, lastSyncedDbBlocksRef])

  // Clear active scouts when no event
  useEffect(() => {
    if (!hasEvent) {
      setActiveScouts([])
    }
  }, [hasEvent])

  const blocks = localBlocks

  // Toggle active scout
  const toggleActiveScout = useCallback((scoutId: string, checked: boolean) => {
    setActiveScouts(prev => checked ? [...prev, scoutId] : prev.filter(id => id !== scoutId))
  }, [])

  // Sorted users and active set
  const sortedUsers = useMemo<UserWithPartners[]>(() => {
    return [...users].sort((a, b) => a.name.localeCompare(b.name))
  }, [users])

  const usersById = useMemo(() => new Map(sortedUsers.map(user => [user.id, user])), [sortedUsers])
  const activeScoutSet = useMemo(() => new Set(activeScouts), [activeScouts])
  const sortedActiveUsers = useMemo<UserWithPartners[]>(() => {
    return sortedUsers.filter(user => activeScoutSet.has(user.id))
  }, [sortedUsers, activeScoutSet])

  // Partner helpers
  const hasPreferredPartnerInBlock = useCallback((userId: string, block: DisplayBlock) => {
    const user = usersById.get(userId)
    if (!user || user.preferredPartners.length === 0) return false
    const assignedScouts = new Set<string>([
      ...block.redScouts.filter((s): s is string => s !== null),
      ...block.blueScouts.filter((s): s is string => s !== null),
    ])
    return user.preferredPartners.some(partnerId => assignedScouts.has(partnerId))
  }, [usersById])

  const getPairedPartnersInBlock = useCallback((userId: string, block: DisplayBlock) => {
    const user = usersById.get(userId)
    if (!user || user.preferredPartners.length === 0) return []
    const assignedScouts = new Set<string>([
      ...block.redScouts.filter((s): s is string => s !== null),
      ...block.blueScouts.filter((s): s is string => s !== null),
    ])
    return user.preferredPartners.filter(partnerId => assignedScouts.has(partnerId))
  }, [usersById])

  // Workload calculation
  const computeUserWorkload = useCallback((targetBlocks: DisplayBlock[]) => {
    const workload = new Map<string, number>()
    sortedUsers.forEach(user => workload.set(user.id, 0))
    targetBlocks.forEach(block => {
      block.redScouts.forEach(scoutId => {
        if (scoutId) workload.set(scoutId, (workload.get(scoutId) ?? 0) + 1)
      })
      block.blueScouts.forEach(scoutId => {
        if (scoutId) workload.set(scoutId, (workload.get(scoutId) ?? 0) + 1)
      })
    })
    return workload
  }, [sortedUsers])

  const workloadMap = useMemo(() => computeUserWorkload(blocks), [blocks, computeUserWorkload])

  // Schedule summary
  const scheduleSummary = useMemo(() => {
    let totalAssigned = 0
    let unassigned = 0
    let preferredPairHits = 0
    const assignedScoutIds = new Set<string>()

    blocks.forEach(block => {
      [...block.redScouts, ...block.blueScouts].forEach(scoutId => {
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

  // Workload list
  const workloadList = useMemo(() => {
    return sortedUsers
      .map(user => ({
        user,
        blocksAssigned: workloadMap.get(user.id) ?? 0,
        isActive: activeScoutSet.has(user.id),
      }))
      .sort((a, b) => b.blocksAssigned - a.blocksAssigned)
  }, [sortedUsers, workloadMap, activeScoutSet])

  // Assign scout (local only)
  const assignBlockScout = async (blockId: number, alliance: 'red' | 'blue', scoutIndex: number, scoutId: string | null) => {
    setLocalBlocks(prevBlocks => prevBlocks.map(block => {
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
    }))
  }

  // Save all changes
  const saveAllChanges = async () => {
    setIsSaving(true)
    try {
      const assignmentsToMake: Array<{
        blockId: number
        userId: string | null
        alliance: 'red' | 'blue'
        position: number
      }> = []

      localBlocks.forEach(localBlock => {
        const dbBlock = dbBlocks.find(b => b.id === localBlock.id)
        if (!dbBlock) return

        localBlock.redScouts.forEach((scoutId, index) => {
          if (scoutId !== dbBlock.redScouts[index]) {
            assignmentsToMake.push({ blockId: localBlock.id, userId: scoutId, alliance: 'red', position: index })
          }
        })
        localBlock.blueScouts.forEach((scoutId, index) => {
          if (scoutId !== dbBlock.blueScouts[index]) {
            assignmentsToMake.push({ blockId: localBlock.id, userId: scoutId, alliance: 'blue', position: index })
          }
        })
      })

      const batchSize = 20
      for (let i = 0; i < assignmentsToMake.length; i += batchSize) {
        const batch = assignmentsToMake.slice(i, i + batchSize)
        await Promise.all(batch.map(a => assignScout(a.blockId, a.userId, a.alliance, a.position)))
      }

      // Refresh data from server to sync local state
      refreshData()
      toast.success('Changes saved')
    } catch (err) {
      console.error('Error saving changes:', err)
      toast.error('Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  // Discard changes
  const discardChanges = () => {
    setLocalBlocks(mapBlocksToDisplay(dbBlocks))
  }

  // Get available users for a slot
  const getAvailableUsersForSlot = useCallback((block: DisplayBlock, alliance: 'red' | 'blue', scoutIndex: number): UserWithPartners[] => {
    const assignedIds = new Set<string>()
    block.redScouts.forEach((scoutId, index) => {
      if (scoutId && !(alliance === 'red' && index === scoutIndex)) assignedIds.add(scoutId)
    })
    block.blueScouts.forEach((scoutId, index) => {
      if (scoutId && !(alliance === 'blue' && index === scoutIndex)) assignedIds.add(scoutId)
    })
    return sortedActiveUsers.filter(user => !assignedIds.has(user.id))
  }, [sortedActiveUsers])

  // Auto-assign all scouts
  const autoAssignAllScouts = useCallback(() => {
    if (sortedActiveUsers.length === 0) {
      toast.error('Select active scouts first')
      return
    }
    
    setIsAutoAssigning(true)
    let didModify = false

    try {
      setLocalBlocks(prevBlocks => {
        const draftBlocks = prevBlocks.map(block => ({
          ...block,
          redScouts: [...block.redScouts],
          blueScouts: [...block.blueScouts],
        }))

        const workload = computeUserWorkload(draftBlocks)

        const wasAssignedToPreviousBlock = (scoutId: string, blockIndex: number) => {
          if (blockIndex <= 0) return false
          const prevBlock = draftBlocks[blockIndex - 1]
          return [...prevBlock.redScouts, ...prevBlock.blueScouts].includes(scoutId)
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

              for (let i = 0; i < sortedActiveUsers.length; i++) {
                const candidate = sortedActiveUsers[i]
                if (assignedInBlock.has(candidate.id)) continue

                const backToBack = wasAssignedToPreviousBlock(candidate.id, blockIndex) ? 1 : 0
                const workloadValue = workload.get(candidate.id) ?? 0
                const preferredPartnerScore = hasPreferredPartnerInBlock(candidate.id, block) ? 0 : 1
                const score: [number, number, number, number] = [backToBack, workloadValue, preferredPartnerScore, i]

                if (!bestScore ||
                    score[0] < bestScore[0] ||
                    (score[0] === bestScore[0] && score[1] < bestScore[1]) ||
                    (score[0] === bestScore[0] && score[1] === bestScore[1] && score[2] < bestScore[2]) ||
                    (score[0] === bestScore[0] && score[1] === bestScore[1] && score[2] === bestScore[2] && score[3] < bestScore[3])) {
                  bestScore = score
                  bestCandidate = candidate
                }
              }

              if (bestCandidate) {
                currentScouts[slotIndex] = bestCandidate.id
                assignedInBlock.add(bestCandidate.id)
                workload.set(bestCandidate.id, (workload.get(bestCandidate.id) ?? 0) + 1)
                didModify = true
              }
            }
          }

          assignAlliance('red')
          assignAlliance('blue')
        })

        return draftBlocks
      })
      
      if (didModify) {
        toast.success('Scouts auto-assigned')
      }
    } catch (err) {
      console.error('Error auto-assigning:', err)
      toast.error('Failed to auto-assign scouts')
    } finally {
      setIsAutoAssigning(false)
    }
  }, [computeUserWorkload, hasPreferredPartnerInBlock, sortedActiveUsers])

  // Clear all assignments
  const clearAssignments = useCallback(() => {
    setLocalBlocks(prevBlocks => prevBlocks.map(block => ({
      ...block,
      redScouts: block.redScouts.map(() => null),
      blueScouts: block.blueScouts.map(() => null),
    })))
    toast.success('Assignments cleared')
  }, [])

  // Quick assign a single slot with the best available scout
  const quickAssignSlot = useCallback((blockId: number, alliance: 'red' | 'blue', scoutIndex: number) => {
    if (sortedActiveUsers.length === 0) {
      toast.error('Select active scouts first')
      return
    }

    setLocalBlocks(prevBlocks => {
      const blockIndex = prevBlocks.findIndex(b => b.id === blockId)
      if (blockIndex === -1) return prevBlocks

      const block = prevBlocks[blockIndex]
      const currentScouts = alliance === 'red' ? block.redScouts : block.blueScouts
      
      // Skip if already assigned
      if (currentScouts[scoutIndex] !== null) return prevBlocks

      // Get scouts already assigned in this block
      const assignedInBlock = new Set<string>([
        ...block.redScouts.filter((s): s is string => s !== null),
        ...block.blueScouts.filter((s): s is string => s !== null),
      ])

      // Compute current workload
      const workload = computeUserWorkload(prevBlocks)

      // Check if scout was in the previous block (avoid back-to-back)
      const wasAssignedToPreviousBlock = (scoutId: string) => {
        if (blockIndex <= 0) return false
        const prevBlock = prevBlocks[blockIndex - 1]
        return [...prevBlock.redScouts, ...prevBlock.blueScouts].includes(scoutId)
      }

      // Find the best candidate
      let bestCandidate: UserWithPartners | null = null
      let bestScore: [number, number, number, number] | null = null

      for (let i = 0; i < sortedActiveUsers.length; i++) {
        const candidate = sortedActiveUsers[i]
        if (assignedInBlock.has(candidate.id)) continue

        const backToBack = wasAssignedToPreviousBlock(candidate.id) ? 1 : 0
        const workloadValue = workload.get(candidate.id) ?? 0
        const preferredPartnerScore = hasPreferredPartnerInBlock(candidate.id, block) ? 0 : 1
        const score: [number, number, number, number] = [backToBack, workloadValue, preferredPartnerScore, i]

        if (!bestScore ||
            score[0] < bestScore[0] ||
            (score[0] === bestScore[0] && score[1] < bestScore[1]) ||
            (score[0] === bestScore[0] && score[1] === bestScore[1] && score[2] < bestScore[2]) ||
            (score[0] === bestScore[0] && score[1] === bestScore[1] && score[2] === bestScore[2] && score[3] < bestScore[3])) {
          bestScore = score
          bestCandidate = candidate
        }
      }

      if (!bestCandidate) {
        toast.error('No available scouts for this slot')
        return prevBlocks
      }

      // Update the block with the new assignment
      const draftBlocks = [...prevBlocks]
      const updatedBlock = { ...block }
      if (alliance === 'red') {
        updatedBlock.redScouts = [...block.redScouts]
        updatedBlock.redScouts[scoutIndex] = bestCandidate.id
      } else {
        updatedBlock.blueScouts = [...block.blueScouts]
        updatedBlock.blueScouts[scoutIndex] = bestCandidate.id
      }
      draftBlocks[blockIndex] = updatedBlock

      return draftBlocks
    })
  }, [sortedActiveUsers, computeUserWorkload, hasPreferredPartnerInBlock])

  // Handle actions
  const handleSetManualMatchCount = async () => {
    const count = parseInt(manualMatchInput)
    if (!isNaN(count) && count > 0 && count <= 200) {
      setManualMatchCount(count)
      setManualMatchInput('')
      toast.success(`Match count set to ${count}`)
      
      // Auto-regenerate blocks if they already exist
      if (blocks.length > 0) {
        setIsGeneratingBlocks(true)
        try {
          await generateBlocks()
          const numBlocks = Math.ceil(count / blockSize)
          toast.success(`Regenerated ${numBlocks} blocks`)
        } catch (err) {
          console.error('Error regenerating blocks:', err)
          toast.error('Failed to regenerate blocks')
        } finally {
          setIsGeneratingBlocks(false)
        }
      }
    } else {
      toast.error('Enter a valid number between 1 and 200')
    }
  }

  const handleSyncMatchCount = async () => {
    setIsSyncingMatchCount(true)
    try {
      const result = await syncMatchCountFromApi()
      if (result.success) {
        toast.success(`Match count updated to ${result.count}`)
        
        // Auto-regenerate blocks if they already exist
        if (blocks.length > 0) {
          setIsGeneratingBlocks(true)
          try {
            await generateBlocks()
            const numBlocks = Math.ceil(result.count / blockSize)
            toast.success(`Regenerated ${numBlocks} blocks`)
          } catch (err) {
            console.error('Error regenerating blocks:', err)
            toast.error('Failed to regenerate blocks')
          } finally {
            setIsGeneratingBlocks(false)
          }
        }
      } else {
        toast.error('Match schedule not yet available')
      }
    } catch (err) {
      console.error('Error syncing:', err)
      toast.error('Failed to sync match count')
    } finally {
      setIsSyncingMatchCount(false)
    }
  }

  const handleGenerateBlocks = async () => {
    if (matchCount <= 0) {
      toast.error('Set match count first')
      return
    }
    
    setIsGeneratingBlocks(true)
    try {
      await generateBlocks()
      const numBlocks = Math.ceil(matchCount / blockSize)
      toast.success(`Generated ${numBlocks} blocks`)
    } catch (err) {
      console.error('Error generating blocks:', err)
      toast.error('Failed to generate blocks')
    } finally {
      setIsGeneratingBlocks(false)
    }
  }

  const handleReset = async () => {
    setIsResetting(true)
    try {
      await deleteAllBlocks()
      setShowResetDialog(false)
      toast.success('Schedule reset')
    } catch (err) {
      console.error('Error resetting:', err)
      toast.error('Failed to reset schedule')
    } finally {
      setIsResetting(false)
    }
  }

  // Calculated number of blocks
  const calculatedBlocks = matchCount > 0 && blockSize > 0 ? Math.ceil(matchCount / blockSize) : 0

  // Loading state
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

  // No event selected
  if (!hasEvent) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground">Configure scouting blocks and assign scouts.</p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Select an event from the event switcher to manage the scouting schedule.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Error state
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
            Configure block size, set match count, then generate blocks and assign scouts.
          </p>
        </div>
        {hasUnsavedChanges && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-chart-5 border-chart-5">Unsaved Changes</Badge>
            <Button variant="outline" onClick={discardChanges} disabled={isSaving}>Discard</Button>
            <Button onClick={saveAllChanges} disabled={isSaving}>
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>



      {/* Step 1-3: Schedule Configuration - Hide when schedule exists */}
      {blocks.length === 0 && (
        <>
          {/* Step 1: Block Size Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Matches Per Shift</CardTitle>
              </div>
              <CardDescription className="-mb-3">
                Set how many qualification matches each scouting shift will cover.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Label htmlFor="block-size">Matches per shift:</Label>
                <Select 
                  value={blockSize.toString()} 
                  onValueChange={(value) => setBlockSize(parseInt(value))}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Match Count Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Match Count</CardTitle>
              </div>
              <CardDescription>
                Set the total number of qualification matches. API data takes priority when available—sync to get the latest count.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Alert when API data available but different from current */}
              {isApiMatchCountAvailable && apiMatchCount !== matchCount && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>
                      <strong>Update Available:</strong> API shows {apiMatchCount} matches, but you have {matchCount > 0 ? matchCount : 'no count'} set. 
                      Click Sync to update.
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-wrap items-end gap-4">
                {/* Current match count */}
                <div className="space-y-2">
                  <Label>Match Count</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant={matchCount > 0 ? "default" : "secondary"} className="text-sm px-3 py-1">
                      {matchCount > 0 ? matchCount : 'Not Set'}
                    </Badge>
                    {isApiMatchCountAvailable && apiMatchCount === matchCount && (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-600">From API</Badge>
                    )}
                    {isApiMatchCountAvailable && apiMatchCount !== matchCount && (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-600">Needs Update</Badge>
                    )}
                  </div>
                </div>

                {/* API match count display (when available and different) */}
                {isApiMatchCountAvailable && apiMatchCount !== matchCount && (
                  <div className="space-y-2">
                    <Label>API Match Count</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-sm px-3 py-1 text-green-600 border-green-600">
                        {apiMatchCount}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Manual input - only show when API data is NOT available */}
                {!isApiMatchCountAvailable && (
                  <div className="space-y-2">
                    <Label htmlFor="manual-match-count">Set Manually</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="manual-match-count"
                        type="number"
                        min="1"
                        max="200"
                        placeholder="e.g. 80"
                        value={manualMatchInput}
                        onChange={(e) => setManualMatchInput(e.target.value)}
                        className="w-24"
                      />
                      <Button variant="outline" size="sm" onClick={handleSetManualMatchCount} disabled={!manualMatchInput}>
                        Set
                      </Button>
                    </div>
                  </div>
                )}

                {/* Sync from API */}
                <div className="space-y-2">
                  <Label>Sync from API</Label>
                  <Button 
                    variant={isApiMatchCountAvailable && apiMatchCount !== matchCount ? "default" : "outline"} 
                    size="sm" 
                    onClick={handleSyncMatchCount} 
                    disabled={isSyncingMatchCount}
                  >
                    {isSyncingMatchCount ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    {isSyncingMatchCount ? 'Checking...' : 'Sync'}
                  </Button>
                </div>
              </div>

              {matchCount > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ChevronRight className="h-4 w-4" />
                  <span>{matchCount} matches ÷ {blockSize} per shift = <strong>{calculatedBlocks} shifts</strong></span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Generate Shifts */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Generate Shifts</CardTitle>
              </div>
              <CardDescription>
                Create scouting shifts based on the configured match count and shift size.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button onClick={handleGenerateBlocks} disabled={matchCount <= 0 || isGeneratingBlocks}>
                  {isGeneratingBlocks ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</> : 'Generate Shifts'}
                </Button>
                {matchCount <= 0 && (
                  <span className="text-sm text-muted-foreground">Set match count first</span>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Schedule Management - only show when blocks exist */}
      {blocks.length > 0 && (
        <>
          {/* Active Scouts Selection - Collapsible - Only for users with edit permissions */}
          {canEditSchedule && (
            <Collapsible defaultOpen={false}>
              <Card>
                <CardHeader>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Select Active Scouts
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {sortedActiveUsers.length} selected
                        </Badge>
                      </div>
                      <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CardDescription>
                    Choose which scouts are available for assignment.
                  </CardDescription>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent>
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {sortedUsers.map(scout => (
                        <ActiveScoutCheckbox
                          key={scout.id}
                          scout={scout}
                          isActive={activeScoutSet.has(scout.id)}
                          onToggle={toggleActiveScout}
                        />
                      ))}
                    </div>
                    {sortedActiveUsers.length > 0 && (
                      <div className="mt-4 flex items-center gap-4">
                        <Button onClick={autoAssignAllScouts} disabled={isAutoAssigning}>
                          {isAutoAssigning ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Assigning...</> : 'Auto-Assign All'}
                        </Button>
                        <Button variant="outline" onClick={clearAssignments}>Clear All Assignments</Button>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Scouting Schedule */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Scouting Schedule
                  </CardTitle>
                  <CardDescription>
                    Assign scouts to each shift. Scouts stay in position for their entire shift.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-sm px-3 py-1">{blocks.length} shifts</Badge>
                    <span className="text-xs text-muted-foreground">
                      {matchCount} matches · {blockSize}/shift
                    </span>
                  </div>
                  {canEditSchedule && (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => setShowResetDialog(true)}
                      className="gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {blocks.map((block) => (
                  <div key={block.id} className="border rounded-lg p-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold">{block.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Matches: {block.matches.join(', ')}
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Red Alliance */}
                      <div>
                        <h4 className="font-medium text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                          <div className="w-4 h-4 bg-red-500 dark:bg-red-600 rounded"></div>
                          Red Alliance Scouts
                        </h4>
                        <div className="space-y-3">
                          {block.redScouts.map((_, scoutIndex) => {
                            const scoutId = block.redScouts[scoutIndex]
                            const assignedScout = scoutId ? usersById.get(scoutId) : null
                            const availableUsers = getAvailableUsersForSlot(block, 'red', scoutIndex)
                            const isPaired = assignedScout && hasPreferredPartnerInBlock(assignedScout.id, block)
                            const pairedPartners = assignedScout ? getPairedPartnersInBlock(assignedScout.id, block) : []

                            return (
                              <div key={scoutIndex} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
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
                                          className="flex items-center gap-1 text-primary border-primary"
                                          title={`Paired with: ${pairedPartners.map(id => usersById.get(id)?.name).join(', ')}`}
                                        >
                                          <Handshake className="h-3 w-3" />
                                          Paired
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                  {!assignedScout && !canEditSchedule && (
                                    <Badge variant="outline" className="text-muted-foreground">Unassigned</Badge>
                                  )}
                                </div>
                                {canEditSchedule && (
                                  <div className="flex items-center gap-2">
                                    {!assignedScout && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => quickAssignSlot(block.id, 'red', scoutIndex)}
                                        className="text-xs"
                                      >
                                        Quick
                                      </Button>
                                    )}
                                    <Select
                                      value={scoutId || "none"}
                                      onValueChange={(value) => assignBlockScout(block.id, 'red', scoutIndex, value === "none" ? null : value)}
                                    >
                                      <SelectTrigger className="w-40">
                                        <SelectValue placeholder="Select scout" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {availableUsers.map(user => (
                                          <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Blue Alliance */}
                      <div>
                        <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-600 dark:bg-blue-400 rounded"></div>
                          Blue Alliance Scouts
                        </h4>
                        <div className="space-y-3">
                          {block.blueScouts.map((_, scoutIndex) => {
                            const scoutId = block.blueScouts[scoutIndex]
                            const assignedScout = scoutId ? usersById.get(scoutId) : null
                            const availableUsers = getAvailableUsersForSlot(block, 'blue', scoutIndex)
                            const isPaired = assignedScout && hasPreferredPartnerInBlock(assignedScout.id, block)
                            const pairedPartners = assignedScout ? getPairedPartnersInBlock(assignedScout.id, block) : []

                            return (
                              <div key={scoutIndex} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
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
                                          className="flex items-center gap-1 text-primary border-primary"
                                          title={`Paired with: ${pairedPartners.map(id => usersById.get(id)?.name).join(', ')}`}
                                        >
                                          <Handshake className="h-3 w-3" />
                                          Paired
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                  {!assignedScout && !canEditSchedule && (
                                    <Badge variant="outline" className="text-muted-foreground">Unassigned</Badge>
                                  )}
                                </div>
                                {canEditSchedule && (
                                  <div className="flex items-center gap-2">
                                    {!assignedScout && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => quickAssignSlot(block.id, 'blue', scoutIndex)}
                                        className="text-xs"
                                      >
                                        Quick
                                      </Button>
                                    )}
                                    <Select
                                      value={scoutId || "none"}
                                      onValueChange={(value) => assignBlockScout(block.id, 'blue', scoutIndex, value === "none" ? null : value)}
                                    >
                                      <SelectTrigger className="w-40">
                                        <SelectValue placeholder="Select scout" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {availableUsers.map(user => (
                                          <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
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

          {/* Workload Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Scout Workload Distribution
              </CardTitle>
              <CardDescription>
                Shows how many shifts each scout is assigned to.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {workloadList.map(({ user, blocksAssigned, isActive }) => (
                  <div key={user.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.name}</span>
                      {isActive && <Badge variant="default" className="text-xs">Active</Badge>}
                    </div>
                    <Badge variant={blocksAssigned > 0 ? "default" : "secondary"}>
                      {blocksAssigned} shift{blocksAssigned !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card className="gap-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{blocks.length}</div>
              </CardContent>
            </Card>
            <Card className="gap-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assigned</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scheduleSummary.totalAssigned}</div>
              </CardContent>
            </Card>
            <Card className="gap-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scheduleSummary.unassigned}</div>
              </CardContent>
            </Card>
            <Card className="gap-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Scouts</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scheduleSummary.activeAssignedCount}</div>
              </CardContent>
            </Card>
            <Card className="gap-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Preferred Pairings</CardTitle>
                <Handshake className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{scheduleSummary.preferredPairings}</div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Reset Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        onConfirm={handleReset}
        title="Reset Schedule"
        description="This will delete all shifts and assignments for this event. You can then reconfigure and regenerate."
        confirmButtonText="Reset"
        loadingText="Resetting..."
        loading={isResetting}
        variant="destructive"
      />
    </div>
  )
}
