import { Injectable, effect, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { StudentHomeFeed } from './home.models';

@Injectable({ providedIn: 'root' })
export class HomeCacheService {
  private readonly authService = inject(AuthService);
  private feed: StudentHomeFeed | null = null;
  private lastUserId: number | null = this.authService.currentUser()?.id ?? null;

  constructor() {
    effect(() => {
      const userId = this.authService.currentUser()?.id ?? null;
      if (userId !== this.lastUserId) {
        this.lastUserId = userId;
        this.invalidate();
      }
    });
  }

  get(): StudentHomeFeed | null {
    return this.feed;
  }

  set(feed: StudentHomeFeed): void {
    this.feed = feed;
  }

  invalidate(): void {
    this.feed = null;
  }
}
