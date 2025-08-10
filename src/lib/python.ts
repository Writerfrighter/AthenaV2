// lib/python.ts
const BASE = process.env.PYTHON_SERVICE_URL!;

async function pythonFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Python service error ${res.status} on ${path}`);
  }
  return res.json();
}
