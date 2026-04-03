import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { databaseManager } from '@/db/database-manager'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit(request, {
      keyPrefix: 'login',
      windowMs: 60 * 1000,
      maxRequests: 20,
    })

    if (rateLimit.limited) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimit.retryAfterSeconds.toString(),
          },
        }
      )
    }

    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
    }

    const db = databaseManager.getService()

    // For Azure SQL, we need to get the pool directly
    if (!db.getPool) {
      return NextResponse.json({ error: 'Database service does not support direct SQL queries' }, { status: 500 })
    }
    const pool = await db.getPool()

    const result = await pool.request()
      .input('username', username)
      .query(`
        SELECT id, name, username, role, password_hash
        FROM users
        WHERE username = @username
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const user = result.recordset[0]
    const passwordHash = String(user.password_hash || '')

    if (!passwordHash) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const isValidPassword = await bcrypt.compare(password, passwordHash)

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    return NextResponse.json({
      id: user.id.toString(),
      name: user.name,
      username: user.username,
      role: user.role
    })
  } catch (error) {
    console.error('Auth API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
