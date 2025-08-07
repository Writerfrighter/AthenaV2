'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ModeToggle } from "@/components/ui/light-dark-toggle"
import { toast } from "sonner"

// Custom CSS to hide number input spinners
const hideSpinnersStyle = `
  .hide-spinners::-webkit-outer-spin-button,
  .hide-spinners::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .hide-spinners[type=number] {
    -moz-appearance: textfield;
  }
`
import { 
  Plus, 
  Minus, 
  Timer, 
  Target, 
  Zap, 
  Shield, 
  Award,
  AlertTriangle,
  CheckCircle,
  Wifi,
  WifiOff,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"

interface MatchData {
  matchNumber: string
  teamNumber: string
  alliance: 'red' | 'blue'
  position: '1' | '2' | '3'
  
  // Auto Period
  autoStartPosition: string
  autoGamePieces: number
  autoHighScored: number
  autoMidScored: number
  autoLowScored: number
  autoMobility: boolean
  autoDocked: boolean
  
  // Teleop Period
  teleopGamePieces: number
  teleopHighScored: number
  teleopMidScored: number
  teleopLowScored: number
  
  // Endgame
  endgamePosition: string
  endgameDocked: boolean
  endgameEngaged: boolean
  
  // Defense & Penalties
  playedDefense: boolean
  wasDefended: boolean
  penalties: number
  
  // Performance
  robotBroke: boolean
  tippy: boolean
  notes: string
}

const defaultData: MatchData = {
  matchNumber: '',
  teamNumber: '',
  alliance: 'red',
  position: '1',
  
  autoStartPosition: '',
  autoGamePieces: 0,
  autoHighScored: 0,
  autoMidScored: 0,
  autoLowScored: 0,
  autoMobility: false,
  autoDocked: false,
  
  teleopGamePieces: 0,
  teleopHighScored: 0,
  teleopMidScored: 0,
  teleopLowScored: 0,
  
  endgamePosition: '',
  endgameDocked: false,
  endgameEngaged: false,
  
  playedDefense: false,
  wasDefended: false,
  penalties: 0,
  
  robotBroke: false,
  tippy: false,
  notes: ''
}

export default function Page() {
  const [formData, setFormData] = useState<MatchData>(defaultData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine)
    
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    // Set initial status
    updateOnlineStatus()
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  const handleInputChange = (field: keyof MatchData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNumberChange = (field: keyof MatchData, increment: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: Math.max(0, (prev[field] as number) + (increment ? 1 : -1))
    }))
  }

  const handleSubmit = async () => {
    if (!formData.matchNumber || !formData.teamNumber) {
      toast.error("Please fill in match number and team number")
      return
    }

    setIsSubmitting(true)
    
    // Simulate offline storage
    setTimeout(() => {
      toast.success("Match data saved locally!", {
        description: `Match ${formData.matchNumber} for Team ${formData.teamNumber} stored offline and will sync when connected`
      })
      setFormData(defaultData)
      setIsSubmitting(false)
    }, 1000)
  }

  return (
    <>
      <style>{hideSpinnersStyle}</style>
      <div className="min-h-screen bg-background dark:bg-background">
      {/* Header Bar */}
      <div className="bg-white/80 dark:bg-background/80 border-b sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Home
              </Button>
            </Link>
            <div className="h-6 w-px bg-border"></div>
            <h1 className="text-lg font-semibold dark:text-white">Match Scouting</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-foreground" />
              ) : (
                <WifiOff className="h-4 w-4 text-orange-500" />
              )}
              <span className="text-sm text-muted-foreground">
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
            <ModeToggle />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Offline Capabilities Notice */}
        <Card className="shadow-sm">
          <CardContent className="">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <WifiOff className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-primary/90 dark:text-primary">Offline Ready</p>
                <p className="text-sm text-muted-foreground/80">
                  Data is saved locally and will automatically sync when you&apos;re back online
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Match Info */}
        <Card className="border rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary/90">
              <Target className="h-5 w-5" />
              Match Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="matchNumber">Match Number</Label>
              <Input
                id="matchNumber"
                placeholder="Q45"
                value={formData.matchNumber}
                onChange={(e) => handleInputChange('matchNumber', e.target.value)}
                className="focus:border-green-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="teamNumber">Team Number</Label>
              <Input
                id="teamNumber"
                placeholder="492"
                value={formData.teamNumber}
                onChange={(e) => handleInputChange('teamNumber', e.target.value)}
                className="focus:border-green-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Alliance</Label>
              <Select value={formData.alliance} onValueChange={(value) => handleInputChange('alliance', value)}>
                <SelectTrigger className="focus:border-green-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="red">Red Alliance</SelectItem>
                  <SelectItem value="blue">Blue Alliance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Position</Label>
              <Select value={formData.position} onValueChange={(value) => handleInputChange('position', value)}>
                <SelectTrigger className="focus:border-green-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Position 1</SelectItem>
                  <SelectItem value="2">Position 2</SelectItem>
                  <SelectItem value="3">Position 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Autonomous Period */}
        <Card className="border rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary/90">
              <Zap className="h-5 w-5" />
              Autonomous Period
            </CardTitle>
            <CardDescription>
              Performance during the first 15 seconds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Starting Position</Label>
                <Select value={formData.autoStartPosition} onValueChange={(value) => handleInputChange('autoStartPosition', value)}>
                  <SelectTrigger className="focus:border-green-500">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="community">Community</SelectItem>
                    <SelectItem value="charge-station">Charge Station</SelectItem>
                    <SelectItem value="loading-zone">Loading Zone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 md:col-span-1 lg:col-span-2">
                <Label>Game Pieces Picked Up</Label>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleNumberChange('autoGamePieces', false)}
                    className="h-12 w-12 hover:bg-green-50 p-0 flex-shrink-0"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <div className="flex flex-col justify-center items-center flex-grow">
                    <Input
                      type="number"
                      min={0}
                      value={formData.autoGamePieces}
                      onChange={e => handleInputChange('autoGamePieces', Math.max(0, Number(e.target.value)))}
                      className="hide-spinners min-w-[4rem] w-full text-center text-lg font-mono font-semibold bg-muted rounded-md border-none focus:ring-2 focus:ring-green-400"
                      style={{height: '3rem'}}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleNumberChange('autoGamePieces', true)}
                    className="h-12 w-12 hover:bg-green-50 p-0 flex-shrink-0"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            <Separator className="" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">High Scored</Label>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleNumberChange('autoHighScored', false)}
                    className="h-12 w-12 hover:bg-green-50 p-0 flex-shrink-0"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <div className="flex flex-col justify-center items-center flex-grow">
                    <Input
                      type="number"
                      min={0}
                      value={formData.autoHighScored}
                      onChange={e => handleInputChange('autoHighScored', Math.max(0, Number(e.target.value)))}
                      className="hide-spinners min-w-[4rem] w-full text-center text-lg font-mono font-semibold bg-muted rounded-md border-none focus:ring-2 focus:ring-green-400"
                      style={{height: '3rem'}}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleNumberChange('autoHighScored', true)}
                    className="h-12 w-12 hover:bg-green-50 p-0 flex-shrink-0"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Mid Scored</Label>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleNumberChange('autoMidScored', false)}
                    className="h-12 w-12 hover:bg-green-50 p-0 flex-shrink-0"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <div className="flex flex-col justify-center items-center flex-grow">
                    <Input
                      type="number"
                      min={0}
                      value={formData.autoMidScored}
                      onChange={e => handleInputChange('autoMidScored', Math.max(0, Number(e.target.value)))}
                      className="hide-spinners min-w-[4rem] w-full text-center text-lg font-mono font-semibold bg-muted rounded-md border-none focus:ring-2 focus:ring-green-400"
                      style={{height: '3rem'}}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleNumberChange('autoMidScored', true)}
                    className="h-12 w-12 hover:bg-green-50 p-0 flex-shrink-0"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <Label className="text-sm font-medium">Low Scored</Label>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleNumberChange('autoLowScored', false)}
                    className="h-12 w-12 hover:bg-green-50 p-0 flex-shrink-0"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <div className="flex flex-col justify-center items-center flex-grow">
                    <Input
                      type="number"
                      min={0}
                      value={formData.autoLowScored}
                      onChange={e => handleInputChange('autoLowScored', Math.max(0, Number(e.target.value)))}
                      className="hide-spinners min-w-[4rem] w-full text-center text-lg font-mono font-semibold bg-muted rounded-md border-none focus:ring-2 focus:ring-green-400"
                      style={{height: '3rem'}}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleNumberChange('autoLowScored', true)}
                    className="h-12 w-12 hover:bg-green-50 p-0 flex-shrink-0"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-4">
                <Switch
                  id="autoMobility"
                  checked={formData.autoMobility}
                  onCheckedChange={(checked) => handleInputChange('autoMobility', checked)}
                  className="scale-125"
                />
                <Label htmlFor="autoMobility" className="text-base font-medium cursor-pointer">
                  Mobility
                </Label>
              </div>
              
              <div className="flex items-center space-x-4">
                <Switch
                  id="autoDocked"
                  checked={formData.autoDocked}
                  onCheckedChange={(checked) => handleInputChange('autoDocked', checked)}
                  className="scale-125"
                />
                <Label htmlFor="autoDocked" className="text-base font-medium cursor-pointer">
                  Docked
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teleop Period */}
        <Card className="border rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary/90">
              <Award className="h-5 w-5" />
              Teleop Period
            </CardTitle>
            <CardDescription>
              Driver-controlled period performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Game Pieces</Label>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleNumberChange('teleopGamePieces', false)}
                    className="h-12 w-12 hover:bg-green-50 p-0 flex-shrink-0"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <div className="flex flex-col justify-center items-center flex-grow">
                    <Input
                      type="number"
                      min={0}
                      value={formData.teleopGamePieces}
                      onChange={e => handleInputChange('teleopGamePieces', Math.max(0, Number(e.target.value)))}
                      className="hide-spinners min-w-[4rem] w-full text-center text-lg font-mono font-semibold bg-muted rounded-md border-none focus:ring-2 focus:ring-green-400"
                      style={{height: '3rem'}}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleNumberChange('teleopGamePieces', true)}
                    className="h-12 w-12 hover:bg-green-50 p-0 flex-shrink-0"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">High Scored</Label>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleNumberChange('teleopHighScored', false)}
                    className="h-12 w-12 hover:bg-green-50 p-0 flex-shrink-0"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <div className="flex flex-col justify-center items-center flex-grow">
                    <Input
                      type="number"
                      min={0}
                      value={formData.teleopHighScored}
                      onChange={e => handleInputChange('teleopHighScored', Math.max(0, Number(e.target.value)))}
                      className="hide-spinners min-w-[4rem] w-full text-center text-lg font-mono font-semibold bg-muted rounded-md border-none focus:ring-2 focus:ring-green-400"
                      style={{height: '3rem'}}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleNumberChange('teleopHighScored', true)}
                    className="h-12 w-12 hover:bg-green-50 p-0 flex-shrink-0"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Mid Scored</Label>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleNumberChange('teleopMidScored', false)}
                    className="h-12 w-12 hover:bg-green-50 p-0 flex-shrink-0"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <div className="flex flex-col justify-center items-center flex-grow">
                    <Input
                      type="number"
                      min={0}
                      value={formData.teleopMidScored}
                      onChange={e => handleInputChange('teleopMidScored', Math.max(0, Number(e.target.value)))}
                      className="hide-spinners min-w-[4rem] w-full text-center text-lg font-mono font-semibold bg-muted rounded-md border-none focus:ring-2 focus:ring-green-400"
                      style={{height: '3rem'}}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleNumberChange('teleopMidScored', true)}
                    className="h-12 w-12 hover:bg-green-50 p-0 flex-shrink-0"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Low Scored</Label>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleNumberChange('teleopLowScored', false)}
                    className="h-12 w-12 hover:bg-green-50 p-0 flex-shrink-0"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <div className="flex flex-col justify-center items-center flex-grow">
                    <Input
                      type="number"
                      min={0}
                      value={formData.teleopLowScored}
                      onChange={e => handleInputChange('teleopLowScored', Math.max(0, Number(e.target.value)))}
                      className="hide-spinners min-w-[4rem] w-full text-center text-lg font-mono font-semibold bg-muted rounded-md border-none focus:ring-2 focus:ring-green-400"
                      style={{height: '3rem'}}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleNumberChange('teleopLowScored', true)}
                    className="h-12 w-12 hover:bg-green-50 p-0 flex-shrink-0"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endgame & Defense */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary/90">
                <Shield className="h-5 w-5" />
                Endgame
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-medium">Final Position</Label>
                <Select value={formData.endgamePosition} onValueChange={(value) => handleInputChange('endgamePosition', value)}>
                  <SelectTrigger className="focus:border-green-500 h-12 text-base">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="parked">Parked</SelectItem>
                    <SelectItem value="docked">Docked</SelectItem>
                    <SelectItem value="engaged">Engaged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-4">
                  <Switch
                    id="endgameDocked"
                    checked={formData.endgameDocked}
                    onCheckedChange={(checked) => handleInputChange('endgameDocked', checked)}
                    className="scale-125"
                  />
                  <Label htmlFor="endgameDocked" className="text-base font-medium cursor-pointer">
                    Docked
                  </Label>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Switch
                    id="endgameEngaged"
                    checked={formData.endgameEngaged}
                    onCheckedChange={(checked) => handleInputChange('endgameEngaged', checked)}
                    className="scale-125"
                  />
                  <Label htmlFor="endgameEngaged" className="text-base font-medium cursor-pointer">
                    Engaged
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary/90">
                <AlertTriangle className="h-5 w-5" />
                Defense & Issues
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-center space-x-4">
                  <Switch
                    id="playedDefense"
                    checked={formData.playedDefense}
                    onCheckedChange={(checked) => handleInputChange('playedDefense', checked)}
                    className="scale-125"
                  />
                  <Label htmlFor="playedDefense" className="text-base font-medium cursor-pointer">
                    Played Defense
                  </Label>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Switch
                    id="wasDefended"
                    checked={formData.wasDefended}
                    onCheckedChange={(checked) => handleInputChange('wasDefended', checked)}
                    className="scale-125"
                  />
                  <Label htmlFor="wasDefended" className="text-base font-medium cursor-pointer">
                    Was Defended
                  </Label>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Switch
                    id="robotBroke"
                    checked={formData.robotBroke}
                    onCheckedChange={(checked) => handleInputChange('robotBroke', checked)}
                    className="scale-125"
                  />
                  <Label htmlFor="robotBroke" className="text-base font-medium cursor-pointer">
                    Robot Broke
                  </Label>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Switch
                    id="tippy"
                    checked={formData.tippy}
                    onCheckedChange={(checked) => handleInputChange('tippy', checked)}
                    className="scale-125"
                  />
                  <Label htmlFor="tippy" className="text-base font-medium cursor-pointer">
                    Tippy
                  </Label>
                </div>
              </div>
              
              <div className="space-y-4">
                <Label className="text-base font-medium">Penalties</Label>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleNumberChange('penalties', false)}
                    className="h-12 w-12 hover:bg-green-50 p-0 flex-shrink-0"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <div className="flex flex-col justify-center items-center flex-grow">
                    <Input
                      type="number"
                      min={0}
                      value={formData.penalties}
                      onChange={e => handleInputChange('penalties', Math.max(0, Number(e.target.value)))}
                      className="hide-spinners min-w-[4rem] w-full text-center text-lg font-mono font-semibold bg-muted rounded-md border-none focus:ring-2 focus:ring-green-400"
                      style={{height: '3rem'}}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleNumberChange('penalties', true)}
                    className="h-12 w-12 hover:bg-green-50 p-0 flex-shrink-0"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        <Card className="border rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-primary/90">Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Any additional observations about this match..."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="focus:border-green-500"
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <Card className="border rounded-xl shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Data saves locally and syncs automatically
              </div>
              <div className="flex flex-col md:flex-row gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setFormData(defaultData)}
                  className="hover:bg-green-50 h-12"
                  size="lg"
                >
                  Clear Form
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="min-w-[140px] h-12 bg-green-600 hover:bg-green-700 text-base"
                  size="lg"
                >
                  {isSubmitting ? (
                    "Saving..."
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Save Data
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  )
}
