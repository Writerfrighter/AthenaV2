# Additional Optimization Suggestions

This document provides recommendations for further performance improvements that could be implemented in AthenaV2.

## High-Priority Optimizations

### 1. Implement Response Caching

**Current Issue:** API responses are recalculated on every request, even if the data hasn't changed.

**Proposed Solution:**
```typescript
// Add ETag-based caching
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const data = await fetchData();
  const etag = generateETag(data); // Hash of response data
  
  if (request.headers.get('if-none-match') === etag) {
    return new NextResponse(null, { status: 304 });
  }
  
  return NextResponse.json(data, {
    headers: {
      'ETag': etag,
      'Cache-Control': 'private, max-age=60'
    }
  });
}
```

**Expected Impact:** 30-50% reduction in server processing for repeated requests.

### 2. Add Database Query-Level Aggregations

**Current Issue:** Statistics are calculated in JavaScript after fetching all records from the database.

**Proposed Solution:**
```typescript
// Instead of fetching all entries and calculating in JS
const result = await pool.request().query(`
  SELECT 
    teamNumber,
    COUNT(*) as matchCount,
    AVG(CAST(JSON_VALUE(gameSpecificData, '$.totalPoints') AS FLOAT)) as avgPoints
  FROM matchEntries
  WHERE year = @year AND eventCode = @eventCode
  GROUP BY teamNumber
  ORDER BY avgPoints DESC
`);
```

**Expected Impact:** 50-70% faster for stats endpoints with large datasets.

### 3. Implement Progressive Data Loading

**Current Issue:** Large datasets load all at once, causing slow initial render.

**Proposed Solution:**
```typescript
// Load data in chunks
async function* loadTeamsProgressively(eventCode: string) {
  const CHUNK_SIZE = 20;
  let offset = 0;
  
  while (true) {
    const chunk = await fetchTeams(eventCode, offset, CHUNK_SIZE);
    if (chunk.length === 0) break;
    yield chunk;
    offset += CHUNK_SIZE;
  }
}
```

**Expected Impact:** Improved perceived performance, especially on slower connections.

## Medium-Priority Optimizations

### 4. Optimize JSON Storage Format

**Current Issue:** `gameSpecificData` is stored as JSON strings requiring parse/stringify on every operation.

**Proposed Solution:**
- Store frequently accessed fields (like total points) as separate columns
- Use JSON columns only for variable/optional data
- Index computed columns for common queries

```sql
ALTER TABLE matchEntries 
ADD autoPoints AS CAST(JSON_VALUE(gameSpecificData, '$.autonomous.totalPoints') AS INT) PERSISTED;

CREATE INDEX IX_matchEntries_autoPoints ON matchEntries(autoPoints);
```

**Expected Impact:** 20-30% faster queries, better query optimization.

### 5. Batch Database Operations

**Current Issue:** Import operations insert records one at a time.

**Proposed Solution:**
```typescript
// Use table-valued parameters for bulk inserts
const table = new mssql.Table('matchEntries');
table.columns.add('matchNumber', mssql.Int);
table.columns.add('teamNumber', mssql.Int);
// ... add other columns

for (const entry of entries) {
  table.rows.add(entry.matchNumber, entry.teamNumber, /* ... */);
}

await pool.request().bulk(table);
```

**Expected Impact:** 10-50x faster for import operations.

### 6. Implement Request Deduplication

**Current Issue:** Multiple components may request the same data simultaneously.

**Proposed Solution:**
```typescript
// In database-client.ts
const pendingRequests = new Map<string, Promise<any>>();

async function dedupedFetch(key: string, fetcher: () => Promise<any>) {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  
  const promise = fetcher().finally(() => {
    pendingRequests.delete(key);
  });
  
  pendingRequests.set(key, promise);
  return promise;
}
```

**Expected Impact:** Reduces redundant API calls by 40-60%.

### 7. Add Query Result Pagination

**Current Issue:** Large result sets are returned in full, consuming memory and bandwidth.

**Proposed Solution:**
```typescript
interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

async function getPaginatedMatches(
  page = 1,
  pageSize = 50
): Promise<PaginatedResponse<MatchEntry>> {
  const offset = (page - 1) * pageSize;
  // Use SQL OFFSET/FETCH for efficient pagination
}
```

**Expected Impact:** Reduced memory usage, faster initial page loads.

## Low-Priority Optimizations

### 8. Lazy Load Game Configuration

**Current Issue:** Entire game configuration is loaded at startup.

**Proposed Solution:**
```typescript
// Load only the needed year's config
async function getYearConfig(year: number) {
  return import(`../../config/game-configs/${year}.json`);
}
```

**Expected Impact:** Minimal, but reduces initial bundle size.

### 9. Optimize Image Loading

**Current Issue:** Team images may load slowly or all at once.

**Proposed Solution:**
```typescript
// Use Next.js Image component with priority hints
<Image
  src={teamImage}
  alt={`Team ${teamNumber}`}
  loading="lazy"
  placeholder="blur"
  sizes="(max-width: 768px) 100vw, 33vw"
/>
```

**Expected Impact:** Better perceived performance on image-heavy pages.

### 10. Implement Service Worker Caching

**Current Issue:** API responses aren't cached offline.

**Proposed Solution:**
```typescript
// In sw.ts, add runtime caching for API routes
runtimeCaching: [
  {
    urlPattern: /^https:\/\/.*\/api\/database\/.*/,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'api-cache',
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 5 * 60 // 5 minutes
      }
    }
  }
]
```

**Expected Impact:** Better offline experience, reduced server load.

## Performance Monitoring Recommendations

### 1. Add Performance Metrics

```typescript
// Create a performance monitoring utility
class PerformanceMonitor {
  static async measureAsync<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      const duration = performance.now() - start;
      console.log(`[Perf] ${name}: ${duration.toFixed(2)}ms`);
    }
  }
}

// Usage in API routes
const data = await PerformanceMonitor.measureAsync(
  'fetch-stats',
  () => fetchStats(year, eventCode)
);
```

### 2. Set Up Performance Budgets

```javascript
// In next.config.ts
module.exports = {
  performance: {
    budgets: [
      {
        path: '/',
        maxSize: 500, // KB
      },
      {
        path: '/api/*',
        maxTime: 1000, // ms
      }
    ]
  }
};
```

### 3. Implement Error Tracking

```typescript
// Track slow queries for optimization
if (duration > 500) {
  console.warn(`Slow query detected: ${endpoint} took ${duration}ms`);
  // Send to monitoring service
}
```

## Testing Performance Improvements

### Load Testing Script

```typescript
// test-load.ts
async function loadTest(url: string, requests: number) {
  const times: number[] = [];
  
  for (let i = 0; i < requests; i++) {
    const start = Date.now();
    await fetch(url);
    times.push(Date.now() - start);
  }
  
  const avg = times.reduce((a, b) => a + b) / times.length;
  const p95 = times.sort()[Math.floor(times.length * 0.95)];
  
  console.log(`Average: ${avg}ms, P95: ${p95}ms`);
}
```

### Benchmarking Checklist

- [ ] Test with realistic data volumes (100+ teams, 500+ matches)
- [ ] Test concurrent requests (10+ simultaneous users)
- [ ] Test with slow network conditions
- [ ] Test cache hit/miss scenarios
- [ ] Profile memory usage over time
- [ ] Test database query performance

## Implementation Priority

1. **Immediate** (High impact, low effort):
   - Response caching (ETag)
   - Request deduplication
   - Database aggregations for stats

2. **Short-term** (High impact, medium effort):
   - JSON storage optimization
   - Batch database operations
   - Query result pagination

3. **Long-term** (Medium impact, high effort):
   - Progressive data loading
   - Service worker caching
   - Comprehensive performance monitoring

## Resources

- [Web Performance Best Practices](https://web.dev/performance/)
- [SQL Server Performance Tuning](https://learn.microsoft.com/en-us/sql/relational-databases/performance/performance-monitoring-and-tuning-tools)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
