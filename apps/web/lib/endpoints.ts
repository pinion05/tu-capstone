/**
 * API Endpoint Configuration
 */
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  TIMEOUT: 10000,
} as const;

export const ENDPOINTS = {
  AUTH: {
    ME: '/api/auth/me',
    LOGIN_TEMP: '/api/auth/login/temp',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    OAUTH2_GOOGLE: '/oauth2/authorization/google',
  },
  LECTURE: {
    LIST: '/api/lectures',
    CREATE: '/api/lectures',
    DETAIL: (id: number | string) => `/api/lectures/${id}`,
  },
  RECORD: {
    COMPLETE: '/api/internal/record/complete',
  }
} as const;

export type ApiEndpoint = typeof ENDPOINTS;
