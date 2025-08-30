import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { AzureSqlDatabaseService } from '@/db/azuresql-database-service'

// Hardcoded Azure SQL configuration
const AZURE_SQL_CONFIG = {
  server: process.env.AZURE_SQL_SERVER || 'your-server.database.windows.net',
  database: "users", // process.env.AZURE_SQL_DATABASE || 'ScoutingDatabase',
  user: process.env.AZURE_SQL_USER || 'your-username',
  password: process.env.AZURE_SQL_PASSWORD || 'your-password',
  useManagedIdentity: false
}

// Initialize Azure SQL service
let dbService: AzureSqlDatabaseService

function getDbService() {
  if (!dbService) {
    dbService = new AzureSqlDatabaseService(AZURE_SQL_CONFIG)
  }
  return dbService
}

export async function POST(request: NextRequest) {
  try {
    const { name, username, password } = await request.json()

    // Validate required fields
    if (!name || !username || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
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

    const db = getDbService()
    const pool = await db['getPool']()

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
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create user
    const result = await pool.request()
      .input('id', userId)
      .input('name', name)
      .input('username', username)
      .input('passwordHash', hashedPassword)
      .query(`
        INSERT INTO users (id, name, username, password_hash, role, created_at, updated_at)
        VALUES (@id, @name, @username, @passwordHash, 'scout', GETDATE(), GETDATE())
      `)

    return NextResponse.json(
      { message: 'User created successfully' },
      { status: 201 }
    )

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
