'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Users, Plus, Handshake } from "lucide-react"

// Dummy data for matches
const dummyMatches = [
  {
    id: 1,
    name: "Qualification Match 1",
    time: "9:00 AM",
    date: "2025-09-28",
    redAlliance: [
      { team: "Team 123", scoutId: null as number | null },
      { team: "Team 456", scoutId: null as number | null },
      { team: "Team 789", scoutId: null as number | null }
    ],
    blueAlliance: [
      { team: "Team 234", scoutId: null as number | null },
      { team: "Team 567", scoutId: null as number | null },
      { team: "Team 890", scoutId: null as number | null }
    ]
  },
  {
    id: 2,
    name: "Qualification Match 2",
    time: "9:15 AM",
    date: "2025-09-28",
    redAlliance: [
      { team: "Team 345", scoutId: null as number | null },
      { team: "Team 678", scoutId: null as number | null },
      { team: "Team 901", scoutId: null as number | null }
    ],
    blueAlliance: [
      { team: "Team 456", scoutId: null as number | null },
      { team: "Team 789", scoutId: null as number | null },
      { team: "Team 012", scoutId: null as number | null }
    ]
  },
  {
    id: 3,
    name: "Qualification Match 3",
    time: "9:30 AM",
    date: "2025-09-28",
    redAlliance: [
      { team: "Team 567", scoutId: null as number | null },
      { team: "Team 890", scoutId: null as number | null },
      { team: "Team 123", scoutId: null as number | null }
    ],
    blueAlliance: [
      { team: "Team 678", scoutId: null as number | null },
      { team: "Team 901", scoutId: null as number | null },
      { team: "Team 234", scoutId: null as number | null }
    ]
  },
  {
    id: 4,
    name: "Qualification Match 4",
    time: "9:45 AM",
    date: "2025-09-28",
    redAlliance: [
      { team: "Team 789", scoutId: null as number | null },
      { team: "Team 012", scoutId: null as number | null },
      { team: "Team 345", scoutId: null as number | null }
    ],
    blueAlliance: [
      { team: "Team 890", scoutId: null as number | null },
      { team: "Team 123", scoutId: null as number | null },
      { team: "Team 456", scoutId: null as number | null }
    ]
  },
  {
    id: 5,
    name: "Qualification Match 5",
    time: "10:00 AM",
    date: "2025-09-28",
    redAlliance: [
      { team: "Team 901", scoutId: null as number | null },
      { team: "Team 234", scoutId: null as number | null },
      { team: "Team 567", scoutId: null as number | null }
    ],
    blueAlliance: [
      { team: "Team 012", scoutId: null as number | null },
      { team: "Team 345", scoutId: null as number | null },
      { team: "Team 678", scoutId: null as number | null }
    ]
  }
]

// Define scouting blocks
const scoutingBlocks = [
  {
    id: 1,
    name: "Block 1",
    timeRange: "9:00 AM - 10:00 AM",
    matches: [1, 2, 3, 4, 5],
    redScouts: [null, null, null] as (number | null)[],
    blueScouts: [null, null, null] as (number | null)[]
  },
  {
    id: 2,
    name: "Block 2",
    timeRange: "10:00 AM - 11:00 AM",
    matches: [6, 7, 8, 9, 10],
    redScouts: [null, null, null] as (number | null)[],
    blueScouts: [null, null, null] as (number | null)[]
  },
  {
    id: 3,
    name: "Block 3",
    timeRange: "11:00 AM - 12:00 PM",
    matches: [11, 12, 13, 14, 15],
    redScouts: [null, null, null] as (number | null)[],
    blueScouts: [null, null, null] as (number | null)[]
  },
  {
    id: 4,
    name: "Block 4",
    timeRange: "1:00 PM - 2:00 PM",
    matches: [16, 17, 18, 19, 20],
    redScouts: [null, null, null] as (number | null)[],
    blueScouts: [null, null, null] as (number | null)[]
  },
  {
    id: 5,
    name: "Block 5",
    timeRange: "2:00 PM - 3:00 PM",
    matches: [21, 22, 23, 24, 25],
    redScouts: [null, null, null] as (number | null)[],
    blueScouts: [null, null, null] as (number | null)[]
  }
]

// Dummy data for users
const dummyUsers = [
  { id: 1, name: "Alice Johnson", preferredPartners: [2, 3] },
  { id: 2, name: "Bob Smith", preferredPartners: [1, 4] },
  { id: 3, name: "Charlie Brown", preferredPartners: [1, 5] },
  { id: 4, name: "Diana Prince", preferredPartners: [2, 6] },
  { id: 5, name: "Eve Wilson", preferredPartners: [3, 7] },
  { id: 6, name: "Frank Miller", preferredPartners: [4, 8] },
  { id: 7, name: "Grace Lee", preferredPartners: [5, 9] },
  { id: 8, name: "Henry Davis", preferredPartners: [6] },
  { id: 9, name: "Ivy Chen", preferredPartners: [] },
]

interface ScheduleEntry {
  matchId: number
  userId: number | null
}

export default function ScheduleMakerPage() {
  const [blocks, setBlocks] = useState(scoutingBlocks)

  // Helper function to check if a user has a preferred partner in a block
  const hasPreferredPartnerInBlock = (userId: number, block: typeof scoutingBlocks[0]) => {
    const user = dummyUsers.find(u => u.id === userId)
    if (!user) return false

    const assignedScouts = [...block.redScouts, ...block.blueScouts].filter(scout => scout !== null)
    return user.preferredPartners.some(partnerId => assignedScouts.includes(partnerId))
  }

  // Helper function to get paired partners for a user in a block
  const getPairedPartnersInBlock = (userId: number, block: typeof scoutingBlocks[0]) => {
    const user = dummyUsers.find(u => u.id === userId)
    if (!user) return []

    const assignedScouts = [...block.redScouts, ...block.blueScouts].filter(scout => scout !== null)
    return user.preferredPartners.filter(partnerId => assignedScouts.includes(partnerId))
  }

  // Update matches based on block assignments
  const matches = dummyMatches.map(match => {
    const block = blocks.find(b => b.matches.includes(match.id))
    if (!block) return match

    const updatedMatch = { ...match }
    // Assign scouts from block to match teams
    updatedMatch.redAlliance = updatedMatch.redAlliance.map((team, index) => ({
      ...team,
      scoutId: block.redScouts[index] || null
    }))
    updatedMatch.blueAlliance = updatedMatch.blueAlliance.map((team, index) => ({
      ...team,
      scoutId: block.blueScouts[index] || null
    }))
    return updatedMatch
  })

  const assignBlockScout = (blockId: number, alliance: 'red' | 'blue', scoutIndex: number, scoutId: number | null) => {
    setBlocks(prev => prev.map(block => {
      if (block.id !== blockId) return block

      const updatedBlock = { ...block }
      if (alliance === 'red') {
        updatedBlock.redScouts = updatedBlock.redScouts.map((scout, index) =>
          index === scoutIndex ? scoutId : scout
        )
      } else {
        updatedBlock.blueScouts = updatedBlock.blueScouts.map((scout, index) =>
          index === scoutIndex ? scoutId : scout
        )
      }
      return updatedBlock
    }))
  }

  const getAssignedBlockScout = (blockId: number, alliance: 'red' | 'blue', scoutIndex: number) => {
    const block = blocks.find(b => b.id === blockId)
    if (!block) return null

    const scoutId = alliance === 'red' ? block.redScouts[scoutIndex] : block.blueScouts[scoutIndex]
    return scoutId ? dummyUsers.find(u => u.id === scoutId) : null
  }

  const getAvailableUsersForBlocks = (blockId: number, alliance: 'red' | 'blue', scoutIndex: number) => {
    // Only filter out scouts assigned to the SAME position in the SAME block
    // Allow scouts to be assigned to multiple blocks (different time periods)
    const assignedUserIds: number[] = []
    blocks.forEach(block => {
      if (block.id === blockId) {
        block.redScouts.forEach((scoutId, index) => {
          if (scoutId && !(alliance === 'red' && index === scoutIndex)) {
            assignedUserIds.push(scoutId)
          }
        })
        block.blueScouts.forEach((scoutId, index) => {
          if (scoutId && !(alliance === 'blue' && index === scoutIndex)) {
            assignedUserIds.push(scoutId)
          }
        })
      }
    })
    return dummyUsers.filter(u => !assignedUserIds.includes(u.id))
  }

  const autoAssignBlockScouts = () => {
    // Calculate scout workload distribution for fair assignment
    const scoutWorkload: { [key: number]: number } = {}
    dummyUsers.forEach(scout => {
      scoutWorkload[scout.id] = 0
    })

    // Count current assignments
    blocks.forEach(block => {
      block.redScouts.forEach(scoutId => {
        if (scoutId) scoutWorkload[scoutId]++
      })
      block.blueScouts.forEach(scoutId => {
        if (scoutId) scoutWorkload[scoutId]++
      })
    })

    // Helper function to assign scouts to a specific alliance in a block
    const assignAllianceScouts = (block: typeof scoutingBlocks[0], alliance: 'red' | 'blue', currentScouts: (number | null)[]) => {
      // Helper function to check if scout was assigned to previous block
      const wasAssignedToPreviousBlock = (scoutId: number) => {
        const previousBlock = blocks.find(b => b.id === block.id - 1)
        if (!previousBlock) return false
        return [...previousBlock.redScouts, ...previousBlock.blueScouts].includes(scoutId)
      }

      return currentScouts.map((currentScout) => {
        if (currentScout) return currentScout // Keep existing assignments

        // Find available scouts sorted by current workload (lowest first), then by preferred partner tiebreaker
        // Penalize scouts assigned to previous block to reduce back-to-back scouting
        const availableScouts = dummyUsers
          .filter(scout => !block.redScouts.includes(scout.id) && !block.blueScouts.includes(scout.id))
          .sort((a, b) => {
            // First priority: avoid back-to-back assignments
            const aBackToBack = wasAssignedToPreviousBlock(a.id)
            const bBackToBack = wasAssignedToPreviousBlock(b.id)
            if (aBackToBack && !bBackToBack) return 1
            if (!aBackToBack && bBackToBack) return -1

            // Second priority: workload distribution
            const workloadDiff = scoutWorkload[a.id] - scoutWorkload[b.id]
            if (workloadDiff !== 0) return workloadDiff

            // Third priority: prefer scouts with preferred partners in this block
            const aHasPartner = hasPreferredPartnerInBlock(a.id, block)
            const bHasPartner = hasPreferredPartnerInBlock(b.id, block)
            return bHasPartner ? 1 : aHasPartner ? -1 : 0
          })

        if (availableScouts.length > 0) {
          const selectedScout = availableScouts[0]
          scoutWorkload[selectedScout.id]++
          return selectedScout.id
        }
        return null
      })
    }

    // Create a copy of blocks to modify
    const newBlocks = blocks.map(block => ({ ...block }))

    // Assign scouts to each block position, prioritizing scouts with fewer assignments
    newBlocks.forEach(block => {
      // Assign red scouts
      block.redScouts = assignAllianceScouts(block, 'red', block.redScouts)

      // Assign blue scouts
      block.blueScouts = assignAllianceScouts(block, 'blue', block.blueScouts)
    })

    setBlocks(newBlocks)
  }

  const clearAllBlockAssignments = () => {
    setBlocks(prev => prev.map(block => ({
      ...block,
      redScouts: [null, null, null],
      blueScouts: [null, null, null]
    })))
  }

  const assignNextBlockScout = (blockId: number, alliance: 'red' | 'blue', scoutIndex: number) => {
    // Calculate current workload for all scouts
    const scoutWorkload: { [key: number]: number } = {}
    dummyUsers.forEach(scout => {
      scoutWorkload[scout.id] = 0
    })

    blocks.forEach(block => {
      block.redScouts.forEach(scoutId => {
        if (scoutId) scoutWorkload[scoutId]++
      })
      block.blueScouts.forEach(scoutId => {
        if (scoutId) scoutWorkload[scoutId]++
      })
    })

    const availableUsers = getAvailableUsersForBlocks(blockId, alliance, scoutIndex)
      .sort((a, b) => {
        const workloadDiff = scoutWorkload[a.id] - scoutWorkload[b.id]
        if (workloadDiff !== 0) return workloadDiff
        // Tiebreaker: prefer scouts with preferred partners in this block
        const block = blocks.find(b => b.id === blockId)
        if (!block) return 0
        const aHasPartner = hasPreferredPartnerInBlock(a.id, block)
        const bHasPartner = hasPreferredPartnerInBlock(b.id, block)
        return bHasPartner ? 1 : aHasPartner ? -1 : 0
      })

    if (availableUsers.length > 0) {
      assignBlockScout(blockId, alliance, scoutIndex, availableUsers[0].id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scouting Blocks</h1>
          <p className="text-muted-foreground">
            Assign scouts to time blocks so they can stay in position for multiple matches. The system ensures fair workload distribution when scouts need to cover multiple blocks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={autoAssignBlockScouts}>
            Auto-Assign Scouts
          </Button>
          <Button variant="outline" onClick={clearAllBlockAssignments}>
            Clear All
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Block
          </Button>
        </div>
      </div>

      {/* Schedule Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Scouting Blocks
          </CardTitle>
          <CardDescription>
            Assign scouts to time blocks covering multiple matches. Scouts stay in position for their entire block and can be assigned to multiple blocks with fair workload distribution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {blocks.map((block) => (
              <div key={block.id} className="border rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold">{block.name}</h3>
                    <p className="text-muted-foreground">{block.timeRange}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Matches: {block.matches.join(', ')}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Red Alliance Scouts */}
                  <div>
                    <h4 className="font-medium text-red-600 mb-4 flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      Red Alliance Scouts
                    </h4>
                    <div className="space-y-3">
                      {block.redScouts.map((_, scoutIndex) => {
                        const assignedScout = getAssignedBlockScout(block.id, 'red', scoutIndex)
                        const availableUsers = getAvailableUsersForBlocks(block.id, 'red', scoutIndex)
                        const isPaired = assignedScout && hasPreferredPartnerInBlock(assignedScout.id, block)
                        const pairedPartners = assignedScout ? getPairedPartnersInBlock(assignedScout.id, block) : []

                        return (
                          <div key={scoutIndex} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
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
                                      className="flex items-center gap-1 text-green-700 border-green-600"
                                      title={`Paired with: ${pairedPartners.map(id => dummyUsers.find(u => u.id === id)?.name).join(', ')}`}
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
                                value={assignedScout ? assignedScout.id.toString() : "none"}
                                onValueChange={(value) => assignBlockScout(block.id, 'red', scoutIndex, value === "none" ? null : parseInt(value))}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue placeholder="Select scout" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  {availableUsers.map((user) => (
                                    <SelectItem key={user.id} value={user.id.toString()}>
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
                    <h4 className="font-medium text-blue-600 mb-4 flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      Blue Alliance Scouts
                    </h4>
                    <div className="space-y-3">
                      {block.blueScouts.map((_, scoutIndex) => {
                        const assignedScout = getAssignedBlockScout(block.id, 'blue', scoutIndex)
                        const availableUsers = getAvailableUsersForBlocks(block.id, 'blue', scoutIndex)
                        const isPaired = assignedScout && hasPreferredPartnerInBlock(assignedScout.id, block)
                        const pairedPartners = assignedScout ? getPairedPartnersInBlock(assignedScout.id, block) : []

                        return (
                          <div key={scoutIndex} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
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
                                      className="flex items-center gap-1 text-green-700 border-green-600"
                                      title={`Paired with: ${pairedPartners.map(id => dummyUsers.find(u => u.id === id)?.name).join(', ')}`}
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
                                value={assignedScout ? assignedScout.id.toString() : "none"}
                                onValueChange={(value) => assignBlockScout(block.id, 'blue', scoutIndex, value === "none" ? null : parseInt(value))}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue placeholder="Select scout" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  {availableUsers.map((user) => (
                                    <SelectItem key={user.id} value={user.id.toString()}>
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

      {/* Scout Workload Summary */}
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
            {(() => {
              const scoutWorkload: { [key: number]: number } = {}
              dummyUsers.forEach(scout => {
                scoutWorkload[scout.id] = 0
              })

              blocks.forEach(block => {
                block.redScouts.forEach(scoutId => {
                  if (scoutId) scoutWorkload[scoutId]++
                })
                block.blueScouts.forEach(scoutId => {
                  if (scoutId) scoutWorkload[scoutId]++
                })
              })

              return dummyUsers
                .sort((a, b) => scoutWorkload[b.id] - scoutWorkload[a.id]) // Sort by workload descending
                .map(scout => (
                  <div key={scout.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span className="font-medium">{scout.name}</span>
                    <Badge variant={scoutWorkload[scout.id] > 0 ? "default" : "secondary"}>
                      {scoutWorkload[scout.id]} block{scoutWorkload[scout.id] !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                ))
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
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
            <div className="text-2xl font-bold">
              {blocks.reduce((total, block) =>
                total + block.redScouts.filter(scout => scout !== null).length +
                block.blueScouts.filter(scout => scout !== null).length, 0
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned Positions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {blocks.reduce((total, block) =>
                total + block.redScouts.filter(scout => scout === null).length +
                block.blueScouts.filter(scout => scout === null).length, 0
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Scouts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const activeScoutIds = new Set<number>()
                blocks.forEach(block => {
                  block.redScouts.forEach(scoutId => {
                    if (scoutId) activeScoutIds.add(scoutId)
                  })
                  block.blueScouts.forEach(scoutId => {
                    if (scoutId) activeScoutIds.add(scoutId)
                  })
                })
                return activeScoutIds.size
              })()}
            </div>
            <p className="text-xs text-muted-foreground">
              Scouts assigned to blocks
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preferred Pairings</CardTitle>
            <Handshake className="h-4 w-4 text-green-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {(() => {
                let totalPairings = 0
                blocks.forEach(block => {
                  const assignedScouts = [...block.redScouts, ...block.blueScouts].filter(scout => scout !== null)
                  assignedScouts.forEach(scoutId => {
                    if (scoutId && hasPreferredPartnerInBlock(scoutId, block)) {
                      totalPairings++
                    }
                  })
                })
                return Math.floor(totalPairings / 2) // Divide by 2 since each pair is counted twice
              })()}
            </div>
            <p className="text-xs text-muted-foreground">
              Scout pairs working together
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}