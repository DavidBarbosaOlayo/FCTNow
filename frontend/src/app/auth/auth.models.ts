export type UserRole = 'ALUMNO' | 'EMPRESA' | 'TUTOR_CENTRO' | 'COORDINADOR' | 'ADMIN';

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthenticatedUser = {
  id: number;
  email: string;
  displayName: string;
  roles: UserRole[];
};

export type LoginResponse = {
  tokenType: string;
  accessToken: string;
  expiresAt: string;
  user: AuthenticatedUser;
};

export type AuthSession = LoginResponse;
