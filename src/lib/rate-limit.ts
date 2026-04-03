import { NextRequest } from 'next/server'

type RateLimitEntry = {
  count: number
  resetAt: number
}

type RateLimitResult = {
  limited: boolean
  retryAfterSeconds: number
  remaining: number
}

type RateLimitOptions = {
  keyPrefix: string
  windowMs: number
  maxRequests: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  if (realIp) {
    return realIp
  }

  return 'unknown'
}

export function checkRateLimit(request: NextRequest, options: RateLimitOptions): RateLimitResult {
  const now = Date.now()
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
    }
  }

  if (existingEntry.count >= options.maxRequests) {
    return {
      limited: true,
      retryAfterSeconds: Math.max(1, Math.ceil((existingEntry.resetAt - now) / 1000)),
      remaining: 0,
    }
  }

  existingEntry.count += 1
  rateLimitStore.set(key, existingEntry)

  return {
    limited: false,
    retryAfterSeconds: Math.max(1, Math.ceil((existingEntry.resetAt - now) / 1000)),
    remaining: options.maxRequests - existingEntry.count,
  }
}
