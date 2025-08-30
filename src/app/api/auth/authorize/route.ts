import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { AzureSqlDatabaseService } from '@/db/azuresql-database-service'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
    }

    const db = new AzureSqlDatabaseService({
      server: process.env.AZURE_SQL_SERVER || 'your-server.database.windows.net',
      database: "users", //process.env.AZURE_SQL_DATABASE || 'ScoutingDatabase',
      user: process.env.AZURE_SQL_USER || 'your-username',
      password: process.env.AZURE_SQL_PASSWORD || 'your-password',
      useManagedIdentity: false
    })

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
