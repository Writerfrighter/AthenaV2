"use client"

import * as React from "react"
import { Check, Palette } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { themes, applyTheme } from "@/lib/theme-config"

export function ThemeSelector() {
  const [colorTheme, setColorTheme] = React.useState("green")
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem("color-theme") || "green"
    setColorTheme(savedTheme)
  }, [])

  React.useEffect(() => {
    if (!mounted) return
    applyTheme(colorTheme)
  }, [colorTheme, mounted])

  const handleThemeChange = (themeName: string) => {
    setColorTheme(themeName)
    localStorage.setItem("color-theme", themeName)
    applyTheme(themeName)
  }

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" disabled>
        <Palette className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Palette className="h-5 w-5" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Color Theme</DropdownMenuLabel>
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.name}
            onClick={() => handleThemeChange(theme.name)}
            className="flex items-center justify-between"
          >
            <span>{theme.label}</span>
            {colorTheme === theme.name && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
