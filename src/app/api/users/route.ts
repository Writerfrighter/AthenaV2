import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { databaseManager } from '@/db/database-manager'
import { auth } from '@/lib/auth/config'
import { hasPermission, hasAnyPermission, PERMISSIONS } from '@/lib/auth/roles'

export async function GET() {
  try {
    // Check if user has permission to view users
    // VIEW_USERS: full user management access
    // VIEW_SCHEDULE_USERS: limited access for schedule assignments
    // SCOUT_ON_BEHALF: tablets need to see user list for scout selection
    const session = await auth()
    const allowedPermissions = [
      PERMISSIONS.VIEW_USERS,
      PERMISSIONS.SCOUT_ON_BEHALF
    ]
    if (!session?.user?.role || !hasAnyPermission(session.user.role, allowedPermissions)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const db = databaseManager.getService()
    if (!db.getPool) {
      return NextResponse.json({ error: 'Database service does not support direct SQL queries' }, { status: 500 })
    }
    const pool = await db.getPool()

    const result = await pool.request()
      .query(`
        SELECT id, name, username, role, preferredPartners, created_at, updated_at
        FROM users
        ORDER BY name ASC
      `)

    const users = result.recordset.map(user => {
      let preferredPartners: string[] = []
      if (user.preferredPartners) {
        try {
          preferredPartners = JSON.parse(user.preferredPartners)
        } catch {
          preferredPartners = []
        }
      }
      
      return {
        id: user.id.toString(),
        name: user.name,
        username: user.username,
        role: user.role,
        preferredPartners,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user has permission to create users
    const session = await auth()
    if (!session?.user?.role || !hasPermission(session.user.role, PERMISSIONS.CREATE_USERS)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { name, username, password, role = 'scout' } = await request.json()

    // Validate required fields
    if (!name || !username || !password) {
      return NextResponse.json(
        { error: 'Name, username, and password are required' },
        { status: 400 }
      )
    }

    // Validate username format (alphanumeric, underscore, dash, 3-20 chars)
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3-20 characters and contain only letters, numbers, underscores, or dashes' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['admin', 'lead_scout', 'scout', 'tablet', 'viewer', 'external']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      )
    }

    const db = databaseManager.getService()
    if (!db.getPool) {
      return NextResponse.json({ error: 'Database service does not support direct SQL queries' }, { status: 500 })
    }
    const pool = await db.getPool()

    // Check if user already exists
    const existingUserResult = await pool.request()
      .input('username', username)
      .query('SELECT id FROM users WHERE username = @username')

    if (existingUserResult.recordset.length > 0) {
      return NextResponse.json(
        { error: 'User with this username already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate unique ID for user
    const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`

    // Create user
    await pool.request()
      .input('id', userId)
      .input('name', name)
      .input('username', username)
      .input('passwordHash', hashedPassword)
      .input('role', role)
      .query(`
        INSERT INTO users (id, name, username, password_hash, role, created_at, updated_at)
        VALUES (@id, @name, @username, @passwordHash, @role, GETDATE(), GETDATE())
      `)

    return NextResponse.json(
      { message: 'User created successfully', userId },
      { status: 201 }
    )

  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}