# Tablet Account System Documentation

## Overview
The tablet account system allows dedicated tablets to be used for scouting without requiring frequent login/logout cycles. Tablet accounts can scout on behalf of multiple users, recording data with the selected scout's user ID.

## Features

### New Role: TABLET
A new role has been added to the system with special permissions for multi-user scouting:

- **Role**: `tablet`
- **Key Permission**: `SCOUT_ON_BEHALF` - Allows submitting data with another user's ID
- **Other Permissions**: All standard scout permissions plus `VIEW_USERS` (to see the scout list)

### Scout Selection UI
Tablet accounts see a "Scouting For" card at the top of both match and pit scouting forms. This allows them to:
- View a list of available scouts (users with scout, lead_scout, or admin roles)
- Select which scout they're entering data for
- See the scout's name and username for easy identification

### Data Attribution
When a tablet account submits scouting data:
- The `userId` field is set to the selected scout's ID (not the tablet account's ID)
- All data appears as if it was entered by the selected scout
- This maintains proper attribution and accountability

## Setup Instructions

### Creating a Tablet Account
1. As an admin, go to user management
2. Create a new user with the role set to `tablet`
3. Example naming convention: "Tablet-1", "Tablet-2", etc.
4. Provide credentials to the tablet device

### Using a Tablet Account
1. Log in to the tablet account once (stays logged in)
2. Navigate to match or pit scouting
3. Select which scout is using the tablet from the dropdown
4. Enter scouting data normally
5. Data is saved with the selected scout's user ID

### Switching Scouts
The scout can be changed at any time using the dropdown selector. Each submission uses the currently selected scout's ID.

## Technical Implementation

### Files Modified
1. **src/lib/auth/roles.ts**
   - Added `TABLET` role
   - Added `SCOUT_ON_BEHALF` permission
   - Configured tablet role permissions

2. **src/components/scout-selector.tsx** (new file)
   - Scout selection component
   - Only visible for tablet accounts
   - Auto-populates with eligible scouts

3. **src/components/dynamic-match-scout-form.tsx**
   - Added session tracking
   - Integrated scout selector
   - Validates scout selection before submission
   - Passes `scoutingForUserId` to API

4. **src/components/dynamic-pit-scout-form.tsx**
   - Added session tracking
   - Integrated scout selector
   - Validates scout selection before submission
   - Passes `scoutingForUserId` to API

5. **src/app/api/database/match/route.ts**
   - Accepts `scoutingForUserId` parameter
   - Validates `SCOUT_ON_BEHALF` permission
   - Uses selected scout's ID when applicable

6. **src/app/api/database/pit/route.ts**
   - Accepts `scoutingForUserId` parameter
   - Validates `SCOUT_ON_BEHALF` permission
   - Uses selected scout's ID when applicable

7. **src/app/api/users/route.ts**
   - Added `tablet` to valid roles list

### Data Flow
1. Tablet user selects a scout from the dropdown
2. Form validates scout selection on submission
3. Request includes both session (tablet account) and `scoutingForUserId`
4. API validates tablet has `SCOUT_ON_BEHALF` permission
5. API uses `scoutingForUserId` instead of session user ID
6. Data is saved with the selected scout's attribution

## Benefits

### For Teams
- **No WiFi Required**: Tablets stay logged in, avoiding repeated authentication
- **Quick Scout Switching**: Fast transition between scouts using the same device
- **Proper Attribution**: Data correctly attributed to the actual scout
- **Simplified Workflow**: Less time managing logins, more time scouting

### For Administration
- **Centralized Device Management**: Dedicated tablets can be pre-configured
- **Clear Audit Trail**: All data shows who actually scouted it
- **Role-Based Access**: Tablet accounts have just the permissions they need

## Security Considerations

### Permissions
- Tablet accounts can only scout (create match/pit entries)
- They cannot delete entries or access admin functions
- They can only view the user list to select scouts

### Best Practices
- Use strong passwords for tablet accounts
- Physically secure tablets when not in use
- Regular password rotation for tablet accounts
- Monitor tablet account usage through audit logs

## Troubleshooting

### Scout List Not Showing
- Verify tablet account has `VIEW_USERS` permission
- Check that eligible scouts exist (scout, lead_scout, or admin roles)
- Ensure network connectivity for initial user list fetch

### Submission Errors
- Ensure a scout is selected before submitting
- Verify tablet account has `SCOUT_ON_BEHALF` permission
- Check that the selected scout's user ID is valid

### Wrong User Attribution
- Verify `scoutingForUserId` is being passed in API request
- Check API logs for user ID being used
- Confirm tablet account has proper role assigned

## Future Enhancements
Potential improvements to consider:
- Remember last selected scout per session
- Quick-switch between frequent scout pairs
- Tablet-specific dashboard showing active scouts
- Offline support for scout list caching
