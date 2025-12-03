# Scouter Performance Rating (SPR) - Usage Guide

## Overview

The Scouter Performance Rating (SPR) system is inspired by the OPR (Offensive Power Rating) methodology used in FRC analytics. It measures the accuracy of individual scouters by solving an overdetermined system of linear equations to determine each scouter's contribution to scoring errors.

## How It Works

### The Algorithm

1. **Data Collection**: For each match, we collect:
   - Scouted data from 3 scouters (one per robot on an alliance)
   - Official match scores from FRC/The Blue Alliance
   - Foul points awarded to the alliance

2. **Error Calculation**: For each alliance:
   ```
   Scouted Total = Sum of EPA from all 3 robots (calculated from scouted data)
   Adjusted Official Score = Official Alliance Score - Foul Points
   Observed Error = |Scouted Total - Adjusted Official Score|
   ```

3. **System of Equations**: Each alliance creates one equation:
   ```
   ScouterA + ScouterB + ScouterC = Observed Error
   ```
   
   With N scouters and M matches, we get 2M equations (red + blue alliances) for N unknowns.

4. **Least-Squares Solution**: Solve using normal equations: `(A^T × A) × x = A^T × b`
   - Similar to OPR, but measuring error contribution instead of point contribution

### Key Differences from OPR

- **Lower is better**: Scouters with low error values are more accurate
- **Measures error**: Uses absolute error between scouted and official scores
- **Excludes fouls**: Foul points are subtracted since they're not related to observed robot actions

## Usage Example

```typescript
import { computeScouterAccuracy } from '@/lib/statistics';
import { useCurrentGameConfig } from '@/hooks/use-game-config';

// Example: Calculate SPR for all scouters at an event
async function analyzeScouters(eventCode: string) {
  // 1. Fetch match entries with userId (scouterId) populated
  const response = await fetch(`/api/database/match?eventCode=${eventCode}`);
  const matches = await response.json();
  
  // 2. Fetch official results from The Blue Alliance or your data source
  // Format: Map<matchNumber, { red: { officialScore, foulPoints }, blue: { ... } }>
  const officialResults = new Map([
    [1, {
      red: { officialScore: 125, foulPoints: 10 },
      blue: { officialScore: 98, foulPoints: 5 }
    }],
    [2, {
      red: { officialScore: 142, foulPoints: 15 },
      blue: { officialScore: 110, foulPoints: 0 }
    }],
    // ... more matches
  ]);
  
  // 3. Get year configuration for EPA calculations
  const { getCurrentYearConfig } = useCurrentGameConfig();
  const config = getCurrentYearConfig();
  
  // 4. Calculate scouter accuracy
  const result = computeScouterAccuracy(matches, officialResults, config);
  
  // 5. Display results
  if (result.convergenceAchieved) {
    console.log(`Overall mean error: ${result.overallMeanError.toFixed(2)} points`);
    console.log('\nScouter Rankings (Best to Worst):');
    
    result.scouters.forEach((scouter, index) => {
      console.log(
        `${index + 1}. ${scouter.scouterId} - ` +
        `Error Value: ${scouter.errorValue.toFixed(2)}, ` +
        `Matches: ${scouter.matchesScounted}, ` +
        `Percentile: ${scouter.percentile}%`
      );
      
      // Warn about low sample sizes
      if (scouter.matchesScounted < 10) {
        console.log(`   ⚠️ Warning: Only ${scouter.matchesScounted} matches - results may be unreliable`);
      }
    });
    
    // Show warnings if any
    if (result.message) {
      console.log(`\n⚠️ ${result.message}`);
    }
  } else {
    console.error('Failed to calculate SPR:', result.message);
  }
}
```

## Interpreting Results

### Error Value
- **Lower is better** - represents average error contribution per match
- Relative comparison is more important than absolute values
- Example: Error value of 2.5 means this scouter contributes ~2.5 points of error per match on average

### Percentile
- **Higher is better** - 100th percentile is the best performer
- Top 25-50% performers are doing well
- Use for quick visual ranking

### Matches Scouted
- **Minimum 10 matches recommended** for reliable results
- Fewer matches can lead to overfitting (unusually high or low error values)
- More matches = more reliable SPR calculation

### Total Absolute Error
- Sum of all errors across all matches for this scouter
- Useful for understanding cumulative impact
- Combines with matches scouted to give context to error value

## Best Practices

### 1. Data Requirements
```typescript
// Each match entry MUST have userId populated
const matchEntry: MatchEntry = {
  matchNumber: 1,
  teamNumber: 1234,
  userId: 'scouter-john-doe', // ✅ Required for SPR
  // ... other fields
};
```

### 2. Official Results Format
```typescript
// Create a Map with official scores
const officialResults = new Map<number, {
  red: { officialScore: number; foulPoints: number };
  blue: { officialScore: number; foulPoints: number };
}>();

// Populate from The Blue Alliance API or manual entry
officialResults.set(matchNumber, {
  red: {
    officialScore: 125,  // Total alliance score
    foulPoints: 10       // Foul points awarded BY opponent
  },
  blue: {
    officialScore: 98,
    foulPoints: 5
  }
});
```

### 3. Filtering Results
```typescript
const result = computeScouterAccuracy(matches, officialResults, config);

// Filter for scouters with sufficient data
const reliableScouters = result.scouters.filter(s => s.matchesScounted >= 10);

// Find top performers
const topQuarter = result.scouters.slice(0, Math.ceil(result.scouters.length * 0.25));

// Find scouters needing improvement
const bottomHalf = result.scouters.slice(Math.ceil(result.scouters.length * 0.5));
```

### 4. Real-Time Monitoring
```typescript
// Calculate SPR after each match to track improvement
async function updateSPRDashboard() {
  const result = computeScouterAccuracy(allMatches, officialResults, config);
  
  // Display live leaderboard
  displayLeaderboard(result.scouters);
  
  // Alert scouting lead if someone needs help
  const needsHelp = result.scouters.filter(
    s => s.percentile < 25 && s.matchesScounted >= 10
  );
  
  if (needsHelp.length > 0) {
    notifyScoutingLead(needsHelp);
  }
}
```

## Integration Example: Adding SPR to Dashboard

```typescript
// In your dashboard component
import { useState, useEffect } from 'react';
import { computeScouterAccuracy, ScouterAccuracyResult } from '@/lib/statistics';

export function ScouterPerformanceDashboard({ eventCode }: { eventCode: string }) {
  const [sprResult, setSprResult] = useState<ScouterAccuracyResult | null>(null);
  const { getCurrentYearConfig } = useCurrentGameConfig();
  
  useEffect(() => {
    async function loadSPR() {
      // Fetch matches and official results
      const matches = await fetchMatches(eventCode);
      const officialResults = await fetchOfficialResults(eventCode);
      const config = getCurrentYearConfig();
      
      // Calculate SPR
      const result = computeScouterAccuracy(matches, officialResults, config);
      setSprResult(result);
    }
    
    loadSPR();
  }, [eventCode]);
  
  if (!sprResult) return <div>Loading SPR...</div>;
  
  return (
    <div>
      <h2>Scouter Performance Ratings</h2>
      <p>Overall Mean Error: {sprResult.overallMeanError.toFixed(2)} points</p>
      
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Scouter</th>
            <th>Error Value</th>
            <th>Matches</th>
            <th>Percentile</th>
          </tr>
        </thead>
        <tbody>
          {sprResult.scouters.map((scouter, idx) => (
            <tr key={scouter.scouterId}>
              <td>{idx + 1}</td>
              <td>{scouter.scouterId}</td>
              <td>{scouter.errorValue.toFixed(2)}</td>
              <td>
                {scouter.matchesScounted}
                {scouter.matchesScounted < 10 && ' ⚠️'}
              </td>
              <td>{scouter.percentile}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {sprResult.message && (
        <div className="warning">{sprResult.message}</div>
      )}
    </div>
  );
}
```

## Troubleshooting

### "No valid match data with scouter IDs"
- **Cause**: Match entries don't have `userId` field populated
- **Solution**: Ensure your scouting forms capture and save the scouter's ID

### "No valid equations could be formed"
- **Cause**: No matches have corresponding official results
- **Solution**: Fetch official scores from The Blue Alliance or enter manually

### "Failed to solve linear system"
- **Cause**: Matrix is singular (usually due to insufficient data variety)
- **Solution**: Ensure multiple matches with different scouter combinations

### Unreliable Results
- **Cause**: Scouters with very few matches (<10)
- **Solution**: Filter out or flag scouters with insufficient data
- **Note**: The function warns you automatically if this occurs

## Technical Details

### Algorithm Complexity
- **Time**: O(n² × m) where n = scouters, m = matches
- **Space**: O(n²) for coefficient matrix
- **Convergence**: Uses Gaussian elimination with partial pivoting

### Assumptions
1. Scouting errors are independent and additive
2. Official scores are accurate (ground truth)
3. EPA calculation properly represents contributed points
4. Foul points are properly excluded from analysis

### Limitations
- Works best with 10+ matches per scouter
- Assumes relatively consistent scouting conditions
- Cannot account for systematic biases in game design
- Relative metric, not absolute accuracy measure

## References

- [The Blue Alliance OPR Article](https://blog.thebluealliance.com/2017/10/05/the-math-behind-opr-an-introduction/)
- [Team 102 SPR Wiki](https://wiki.team102.org/scoutradioz/what_is_spr)
- AthenaV2 Documentation: `YEAR_CONFIG_README.md` for EPA configuration

---

For questions or improvements, see the AthenaV2 GitHub repository.
