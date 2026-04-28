import { NextResponse } from 'next/server';
import { DatabaseManager } from '@/db/database-manager';

export async function GET() {
  const manager = DatabaseManager.getInstance();
  const config = manager.getConfig();

  return NextResponse.json({
    currentProvider: config.provider,
    providers: ['azuresql', 'firebase', 'cosmos', 'local'],
    config: {
      provider: config.provider,
      hasAzureSql: !!config.azuresql,
      hasFirebase: !!config.firebase,
      hasCosmos: !!config.cosmos,
      hasLocal: !!config.local
    }
  });
}
