// Requests share in-flight GETs, but never cache responses or replay writes.
const pending = new Map();
let generation = 0;
export function resetApiRequests() {
  generation += 1;
  pending.clear();
}
export async function apiFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const key = JSON.stringify([generation, String(url), [...new Headers(options.headers)].sort()]);
  const share = method === 'GET' && !options.signal;
  const send = async () => {
    try {
      const response = await fetch(url, { ...options, cache: options.cache || 'no-store' });
      window.dispatchEvent(new CustomEvent('api:response', { detail: { status: response.status } }));
      if (method !== 'GET' && response.ok) generation += 1;
      return response;
    } catch (error) {
      if (error.name !== 'AbortError') window.dispatchEvent(new Event('api:failure'));
      throw error;
    }
  };
  if (!share) return send();
  if (!pending.has(key)) {
    const request = send().finally(() => pending.delete(key));
    pending.set(key, request);
  }
  return (await pending.get(key)).clone();
}
