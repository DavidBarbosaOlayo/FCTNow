import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { AuthenticatedUser, AuthSession, UserRole } from './auth.models';

const STORAGE_KEY = 'fctnow.auth.session';
const USER_ROLES: readonly UserRole[] = [
  'ALUMNO',
  'EMPRESA',
  'TUTOR_CENTRO',
  'COORDINADOR',
  'ADMIN',
];

@Injectable({ providedIn: 'root' })
export class AuthSessionStorage {
  private readonly platformId = inject(PLATFORM_ID);

  read(): AuthSession | null {
    const storage = this.browserStorage();

    if (!storage) {
      return null;
    }

    const rawSession = storage.getItem(STORAGE_KEY);

    if (!rawSession) {
      return null;
    }

    try {
      const parsedSession: unknown = JSON.parse(rawSession);

      if (isAuthSession(parsedSession)) {
        return parsedSession;
      }

      this.clear();
    } catch {
      this.clear();
    }

    return null;
  }

  write(session: AuthSession): void {
    this.browserStorage()?.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  clear(): void {
    this.browserStorage()?.removeItem(STORAGE_KEY);
  }

  private browserStorage(): Storage | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    try {
      return globalThis.localStorage;
    } catch {
      return null;
    }
  }
}

function isAuthSession(value: unknown): value is AuthSession {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value['tokenType'] === 'string' &&
    typeof value['accessToken'] === 'string' &&
    typeof value['expiresAt'] === 'string' &&
    isAuthenticatedUser(value['user'])
  );
}

function isAuthenticatedUser(value: unknown): value is AuthenticatedUser {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value['id'] === 'number' &&
    typeof value['email'] === 'string' &&
    typeof value['displayName'] === 'string' &&
    Array.isArray(value['roles']) &&
    value['roles'].every(isUserRole)
  );
}

function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && USER_ROLES.includes(value as UserRole);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
