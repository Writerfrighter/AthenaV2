import { NextRequest } from 'next/server'

type RateLimitEntry = {
  count: number
  resetAt: number
}

type RateLimitResult = {
  limited: boolean
  retryAfterSeconds: number
  remaining: number
  resetAtUnixSeconds: number
}

type RateLimitOptions = {
  keyPrefix: string
  windowMs: number
  maxRequests: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()
const CLEANUP_INTERVAL = 100

let requestsSinceCleanup = 0

function simpleStringHash(input: string): string {
  let hash = 0

  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }

  return Math.abs(hash).toString(36)
}

function cleanupExpiredEntries(now: number): void {
  requestsSinceCleanup += 1

  if (requestsSinceCleanup < CLEANUP_INTERVAL) {
    return
  }

  requestsSinceCleanup = 0

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key)
    }
  }
}

function getClientIp(request: NextRequest): string {
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for')
  const forwardedFor = request.headers.get('x-forwarded-for')
  const clientIp = request.headers.get('x-client-ip')
  const realIp = request.headers.get('x-real-ip')

  if (cfConnectingIp) {
    return cfConnectingIp.trim()
  }

  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim()
  }

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  if (clientIp) {
    return clientIp.trim()
  }

  if (realIp) {
    return realIp.trim()
  }

  const userAgent = request.headers.get('user-agent') ?? 'unknown-user-agent'
  const acceptLanguage = request.headers.get('accept-language') ?? 'unknown-language'

  // Fallback fingerprint avoids turning all users into one shared "unknown" bucket.
  return `fp:${simpleStringHash(`${userAgent}|${acceptLanguage}`)}`
}

export function checkRateLimit(request: NextRequest, options: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  cleanupExpiredEntries(now)

  const clientIp = getClientIp(request)
  const key = `${options.keyPrefix}:${clientIp}`
  const existingEntry = rateLimitStore.get(key)

  if (!existingEntry || existingEntry.resetAt <= now) {
    const resetAt = now + options.windowMs
    rateLimitStore.set(key, { count: 1, resetAt })
    return {
      limited: false,
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
      remaining: options.maxRequests - 1,
      resetAtUnixSeconds: Math.ceil(resetAt / 1000),
    }
  }

  if (existingEntry.count >= options.maxRequests) {
    return {
      limited: true,
      retryAfterSeconds: Math.max(1, Math.ceil((existingEntry.resetAt - now) / 1000)),
      remaining: 0,
      resetAtUnixSeconds: Math.ceil(existingEntry.resetAt / 1000),
    }
  }

  existingEntry.count += 1
  rateLimitStore.set(key, existingEntry)

  return {
    limited: false,
    retryAfterSeconds: Math.max(1, Math.ceil((existingEntry.resetAt - now) / 1000)),
    remaining: options.maxRequests - existingEntry.count,
    resetAtUnixSeconds: Math.ceil(existingEntry.resetAt / 1000),
  }
}

export function getRateLimitHeaders(rateLimit: RateLimitResult, maxRequests: number): Record<string, string> {
  return {
    'Retry-After': rateLimit.retryAfterSeconds.toString(),
    'X-RateLimit-Limit': maxRequests.toString(),
    'X-RateLimit-Remaining': rateLimit.remaining.toString(),
    'X-RateLimit-Reset': rateLimit.resetAtUnixSeconds.toString(),
  }
}
