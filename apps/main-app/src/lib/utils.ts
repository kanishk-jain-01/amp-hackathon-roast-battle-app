import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateBattleId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function generateVoterHash(): string {
  const fingerprint = `${navigator.userAgent}-${screen.width}-${screen.height}-${new Date().getTimezoneOffset()}`
  return btoa(fingerprint).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)
}

export function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
