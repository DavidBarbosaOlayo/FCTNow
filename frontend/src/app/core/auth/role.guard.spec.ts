import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { AuthenticatedUser, UserRole } from '../../auth/auth.models';
import { roleGuard } from './role.guard';

describe('roleGuard', () => {
  let authStub: { currentUser: jasmine.Spy };

  function setupTestBed() {
    authStub = { currentUser: jasmine.createSpy('currentUser').and.returnValue(null) };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
      ],
    });
  }

  function runGuard(allowed: UserRole[]): boolean | UrlTree {
    return TestBed.runInInjectionContext(() => {
      const guard = roleGuard(allowed);
      return guard({} as never, { url: '/tutor' } as never) as boolean | UrlTree;
    });
  }

  function userWithRoles(roles: UserRole[]): AuthenticatedUser {
    return {
      id: 1,
      email: 'tutor@example.com',
      displayName: 'Tutor Demo',
      roles,
    };
  }

  beforeEach(() => {
    setupTestBed();
  });

  it('should redirect to /login when there is no authenticated user', () => {
    authStub.currentUser.and.returnValue(null);

    const result = runGuard(['TUTOR_CENTRO']);

    const router = TestBed.inject(Router);
    expect(result).toEqual(router.parseUrl('/login'));
  });

  it('should redirect to home when the user does not have any allowed role', () => {
    authStub.currentUser.and.returnValue(userWithRoles(['ALUMNO']));

    const result = runGuard(['TUTOR_CENTRO', 'COORDINADOR']);

    const router = TestBed.inject(Router);
    expect(result).toEqual(router.parseUrl('/'));
  });

  it('should allow access when the user has at least one allowed role', () => {
    authStub.currentUser.and.returnValue(userWithRoles(['ALUMNO', 'COORDINADOR']));

    const result = runGuard(['TUTOR_CENTRO', 'COORDINADOR']);

    expect(result).toBeTrue();
  });
});
