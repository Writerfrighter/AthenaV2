"use client";
import { Toaster } from "sonner";
import { useTheme } from "next-themes";
 
export function SonnerToaster() {
  const { theme } = useTheme();
 
  return (
    <Toaster
      theme={theme as 'light' | 'dark' | 'system'}
      richColors
    />
  );
}