import { HttpClient, HttpHeaders } from '@angular/common/http';
import { computed, Injectable, inject, signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { API_BASE_URL } from '../core/api/api.config';
import { AuthenticatedUser, AuthSession, LoginRequest, LoginResponse } from './auth.models';
import { AuthSessionStorage } from './auth-session-storage';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = withoutTrailingSlash(inject(API_BASE_URL));
  private readonly sessionStorage = inject(AuthSessionStorage);
  private readonly sessionState = signal<AuthSession | null>(this.sessionStorage.read());

  readonly session = this.sessionState.asReadonly();
  readonly currentUser = computed(() => this.sessionState()?.user ?? null);
  readonly isAuthenticated = computed(() => this.sessionState() !== null);

  login(credentials: LoginRequest): Observable<LoginResponse> {
    const request: LoginRequest = {
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    };

    return this.http.post<LoginResponse>(this.authUrl('login'), request).pipe(
      tap((response) => {
        this.storeSession(response);
      }),
    );
  }

  loadAuthenticatedUser(): Observable<AuthenticatedUser> {
    const accessToken = this.accessToken();

    if (!accessToken) {
      return throwError(() => new Error('No hay una sesión activa.'));
    }

    return this.http
      .get<AuthenticatedUser>(this.authUrl('me'), {
        headers: new HttpHeaders({ Authorization: `Bearer ${accessToken}` }),
      })
      .pipe(
        tap((user) => {
          const session = this.sessionState();

          if (session) {
            this.storeSession({ ...session, user });
          }
        }),
      );
  }

  logout(): void {
    this.sessionStorage.clear();
    this.sessionState.set(null);
  }

  accessToken(): string | null {
    return this.sessionState()?.accessToken ?? null;
  }

  private storeSession(session: AuthSession): void {
    this.sessionStorage.write(session);
    this.sessionState.set(session);
  }

  private authUrl(resource: 'login' | 'me'): string {
    return `${this.apiBaseUrl}/auth/${resource}`;
  }
}

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/$/, '');
}
