import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../core/api/api.config';
import { AuthenticatedUser, AuthSession, LoginResponse } from './auth.models';
import { AuthService } from './auth.service';
import { AuthSessionStorage } from './auth-session-storage';

describe('AuthService', () => {
  let httpTesting: HttpTestingController;
  let storage: jasmine.SpyObj<AuthSessionStorage>;

  const user: AuthenticatedUser = {
    id: 1,
    email: 'alumno@example.com',
    displayName: 'Alumno Demo',
    roles: ['ALUMNO'],
  };

  const loginResponse: LoginResponse = {
    tokenType: 'Bearer',
    accessToken: 'jwt-token',
    expiresAt: '2026-05-04T12:00:00Z',
    user,
  };

  beforeEach(() => {
    storage = jasmine.createSpyObj<AuthSessionStorage>('AuthSessionStorage', [
      'read',
      'write',
      'clear',
    ]);
    storage.read.and.returnValue(null);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: AuthSessionStorage, useValue: storage },
      ],
    });

    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should post normalized credentials and store the returned session', () => {
    const service = TestBed.inject(AuthService);

    service
      .login({ email: ' Alumno@Example.COM ', password: 'CorrectPassword123!' })
      .subscribe((response) => {
        expect(response).toEqual(loginResponse);
      });

    const request = httpTesting.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'alumno@example.com',
      password: 'CorrectPassword123!',
    });

    request.flush(loginResponse);

    expect(storage.write).toHaveBeenCalledWith(loginResponse);
    expect(service.currentUser()).toEqual(user);
    expect(service.accessToken()).toBe('jwt-token');
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('should load the authenticated user with the stored bearer token', () => {
    const existingSession: AuthSession = {
      ...loginResponse,
      user: { ...user, displayName: 'Nombre anterior' },
    };
    const refreshedUser: AuthenticatedUser = { ...user, displayName: 'Alumno Actualizado' };
    storage.read.and.returnValue(existingSession);
    const service = TestBed.inject(AuthService);

    service.loadAuthenticatedUser().subscribe((response) => {
      expect(response).toEqual(refreshedUser);
    });

    const request = httpTesting.expectOne('/api/auth/me');
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-token');

    request.flush(refreshedUser);

    expect(storage.write).toHaveBeenCalledWith({ ...existingSession, user: refreshedUser });
    expect(service.currentUser()).toEqual(refreshedUser);
  });

  it('should clear the session on logout', () => {
    storage.read.and.returnValue(loginResponse);
    const service = TestBed.inject(AuthService);

    service.logout();

    expect(storage.clear).toHaveBeenCalled();
    expect(service.session()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });
});
