import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { UserRole } from '../../auth/auth.models';
import { AuthService } from '../../auth/auth.service';

export function roleGuard(allowedRoles: ReadonlyArray<UserRole>): CanActivateFn {
  return (): boolean | UrlTree => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const user = auth.currentUser();

    if (!user) {
      return router.parseUrl('/login');
    }

    const hasRole = user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      return router.parseUrl('/');
    }

    return true;
  };
}
