import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Already authenticated in this session — allow immediately
  if (authService.getAccessToken()) {
    return true;
  }

  // Try to restore session from the HttpOnly refresh-token cookie
  return authService.tryRestoreSession().pipe(
    map(() => true),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    map(user => (user?.role === 'Admin') || router.createUrlTree(['/']))
  );
};
