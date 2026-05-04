import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthSession } from './auth.models';
import { AuthSessionStorage } from './auth-session-storage';

describe('AuthSessionStorage', () => {
  const session: AuthSession = {
    tokenType: 'Bearer',
    accessToken: 'jwt-token',
    expiresAt: '2026-05-04T12:00:00Z',
    user: {
      id: 1,
      email: 'alumno@example.com',
      displayName: 'Alumno Demo',
      roles: ['ALUMNO'],
    },
  };

  afterEach(() => {
    localStorage.clear();
  });

  it('should persist and clear a browser session', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    const storage = TestBed.inject(AuthSessionStorage);

    storage.write(session);

    expect(storage.read()).toEqual(session);

    storage.clear();

    expect(storage.read()).toBeNull();
  });

  it('should ignore browser storage when rendered on the server', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const storage = TestBed.inject(AuthSessionStorage);

    expect(storage.read()).toBeNull();
    expect(() => storage.write(session)).not.toThrow();
    expect(() => storage.clear()).not.toThrow();
  });
});
