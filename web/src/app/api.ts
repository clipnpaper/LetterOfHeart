// Use relative /api so it works with Vite proxy in development
// or when the Go backend serves the frontend in production.
// You can override with VITE_API_BASE in .env if needed.
const API_BASE = (import.meta as any).env?.VITE_API_BASE || '/api';

export async function fetchApi<T = any>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  // Respect admin incognito mode stored in localStorage and propagate to server via header
  const incog = typeof localStorage !== 'undefined' && localStorage.getItem("LOH_ADMIN_INCOGNITO") === "true";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers || {}),
  };
  if (incog) {
    headers["X-Incognito"] = "1";
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}
