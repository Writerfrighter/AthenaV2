export async function fetchJSON<T>(
  url: string,
  options: {
    headers?: Record<string,string>
    queryParams?: Record<string,string>
  } = {}
): Promise<T> {
  // Build URL with query params if provided
  const finalUrl = options.queryParams
    ? url + '?' + new URLSearchParams(options.queryParams).toString()
    : url

  const res = await fetch(finalUrl, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  })

  if (!res.ok) {
    throw new Error(`Fetch error ${res.status} on ${finalUrl}`)
  }

  return res.json()
}
