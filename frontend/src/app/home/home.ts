import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '../auth/auth.models';
import { OfertaModalidad } from '../practicas/ofertas.models';
import {
  HomeAnnouncement,
  PeerActivityItem,
  RecommendedHomeOffer,
  StudentHomeFeed,
} from './home.models';
import { HomeCacheService } from './home-cache.service';
import { HomeOfferDetailDialog } from './home-offer-detail-dialog';
import { HomeService } from './home.service';

type FeedStatus = 'idle' | 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-home',
  imports: [RouterLink, HomeOfferDetailDialog],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly authService = inject(AuthService);
  private readonly homeService = inject(HomeService);
  private readonly cache = inject(HomeCacheService);

  protected readonly currentUser = this.authService.currentUser;
  protected readonly status = signal<FeedStatus>('idle');
  protected readonly feed = signal<StudentHomeFeed | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly selectedOffer = signal<RecommendedHomeOffer | null>(null);

  protected readonly isAlumno = computed(() => this.hasRole('ALUMNO'));
  protected readonly shouldShowStudentFeed = computed(() => this.currentUser() && this.isAlumno());

  ngOnInit(): void {
    if (this.shouldShowStudentFeed()) {
      this.loadFeed();
    }
  }

  protected loadFeed(forceRefresh = false): void {
    if (!forceRefresh) {
      const cached = this.cache.get();
      if (cached) {
        this.feed.set(cached);
        this.errorMessage.set('');
        this.status.set('loaded');
        return;
      }
    }

    this.status.set('loading');
    this.errorMessage.set('');

    this.homeService.getStudentFeed().subscribe({
      next: (feed) => {
        this.cache.set(feed);
        this.feed.set(feed);
        this.status.set('loaded');
      },
      error: () => {
        this.feed.set(null);
        this.errorMessage.set(
          'No se pudo cargar tu inicio. Revisa la conexión o inténtalo de nuevo más tarde.',
        );
        this.status.set('error');
      },
    });
  }

  protected primaryOfferLink(offer: RecommendedHomeOffer): string | unknown[] {
    if (offer.offerId) {
      return ['/practicas', offer.offerId];
    }

    return '/practicas';
  }

  protected openOfferDetail(offer: RecommendedHomeOffer): void {
    this.selectedOffer.set(offer);
  }

  protected closeOfferDetail(): void {
    this.selectedOffer.set(null);
  }

  protected activityLink(activity: PeerActivityItem): string {
    return activity.actionUrl ?? '/practicas';
  }

  protected announcementLink(announcement: HomeAnnouncement): string {
    return announcement.actionUrl ?? '/notificaciones';
  }

  protected modalityLabel(modality: OfertaModalidad | null): string {
    switch (modality) {
      case 'PRESENCIAL':
        return 'Presencial';
      case 'HIBRIDA':
        return 'Híbrida';
      case 'REMOTA':
        return 'Remota';
      default:
        return 'Sin modalidad definida';
    }
  }

  protected roleLabel(role: HomeAnnouncement['authorRole']): string {
    return role === 'COORDINADOR' ? 'Coordinación FCT' : 'Tutoría del centro';
  }

  protected announcementLabel(announcement: HomeAnnouncement): string {
    if (announcement.kind === 'ASSIGNMENT') {
      return 'Asignación de tutor';
    }
    return this.roleLabel(announcement.authorRole);
  }

  protected isExternalUrl(url: string | null): boolean {
    return !!url && /^https?:\/\//i.test(url);
  }

  protected avatarInitials(name: string | null): string {
    if (!name) {
      return '?';
    }
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return '?';
    }
    const first = parts[0].charAt(0);
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (first + last).toUpperCase();
  }

  protected formatDate(value: string | null): string {
    if (!value) {
      return 'Fecha pendiente';
    }

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  }

  private hasRole(role: UserRole): boolean {
    return this.currentUser()?.roles.includes(role) ?? false;
  }
}
