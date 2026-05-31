export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  provider?: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
