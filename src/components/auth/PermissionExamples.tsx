// src/components/auth/PermissionExamples.tsx
'use client'

import { PermissionGuard} from './PermissionGuard'
import { PERMISSIONS, ROLES } from '@/lib/auth/roles'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Example component showing how to use permissions throughout the app
export function PermissionExamples() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Permission System Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Granular permission example */}
          <PermissionGuard permission={PERMISSIONS.MANAGE_GAME_CONFIG}>
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <h3 className="font-semibold text-indigo-800">Game Configuration</h3>
              <p className="text-indigo-700">Configure game-specific settings and parameters.</p>
              <Button className="mt-2" variant="default">
                Edit Game Config
              </Button>
            </div>
          </PermissionGuard>

          {/* Multiple permissions example */}
          <PermissionGuard
            permissions={[PERMISSIONS.VIEW_PICKLIST, PERMISSIONS.EDIT_PICKLIST]}
            requireAll={false}
          >
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
              <h3 className="font-semibold text-teal-800">Picklist Management</h3>
              <p className="text-teal-700">View or edit team picklists (requires either view or edit permission).</p>
              <Button className="mt-2" variant="default">
                Manage Picklist
              </Button>
            </div>
          </PermissionGuard>

          {/* Fallback example */}
          <PermissionGuard
            permission={PERMISSIONS.DELETE_USERS}
            fallback={
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-800">User Management</h3>
                <p className="text-gray-700">You don&apos;t have permission to manage users.</p>
                <Badge variant="secondary">Read-only</Badge>
              </div>
            }
          >
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800">User Management</h3>
              <p className="text-yellow-700">Full user management capabilities.</p>
              <Button className="mt-2" variant="default">
                Manage Users
              </Button>
            </div>
          </PermissionGuard>
        </CardContent>
      </Card>

      {/* Role-based navigation example */}
      <Card>
        <CardHeader>
          <CardTitle>Navigation Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">

            <PermissionGuard permission={PERMISSIONS.EDIT_PICKLIST}>
              <Button variant="ghost" className="w-full justify-start">
                📋 Edit Picklist
              </Button>
            </PermissionGuard>

            <PermissionGuard permission={PERMISSIONS.RESET_DATABASE}>
              <Button variant="ghost" className="w-full justify-start text-red-600">
                🗑️ Database Reset
              </Button>
            </PermissionGuard>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}