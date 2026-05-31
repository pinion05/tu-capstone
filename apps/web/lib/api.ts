import { API_CONFIG } from './endpoints';

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      try {
        const refreshRes = await fetch(`${API_CONFIG.BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include'
        });
        
        if (refreshRes.ok) {
          const newResponse = await fetch(url, { ...options, headers, credentials: 'include' });
          if (!newResponse.ok) throw new Error('Retry failed');
          return newResponse.status === 204 ? {} as T : newResponse.json();
        } else {
          window.location.href = '/login?error=session_expired';
        }
      } catch (e) {
        window.location.href = '/login?error=session_expired';
      }
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  // Handle empty responses (like 204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
