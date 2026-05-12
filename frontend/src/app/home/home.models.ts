import { UserRole } from '../auth/auth.models';
import { OfertaModalidad } from '../practicas/ofertas.models';

export type HomeOfferSource = 'INTERNA' | 'EXTERNA';

export type RecommendedHomeOffer = {
  id: string;
  source: HomeOfferSource;
  offerId: number | null;
  externalUrl: string | null;
  title: string;
  company: string;
  location: string;
  modality: OfertaModalidad | null;
  publishedAt: string;
  statusLabel: string;
  matchReasons: string[];
};

export type PeerActivityItem = {
  id: string;
  title: string;
  summary: string;
  metric: string;
  company: string | null;
  studentName: string | null;
  studentPhotoUrl: string | null;
  occurredAt: string;
  actionUrl: string | null;
};

export type HomeAnnouncementKind = 'NOTIFICATION' | 'ASSIGNMENT';

export type HomeAnnouncement = {
  id: string;
  kind: HomeAnnouncementKind;
  title: string;
  body: string;
  authorName: string;
  authorRole: Extract<UserRole, 'TUTOR_CENTRO' | 'COORDINADOR'>;
  publishedAt: string;
  actionLabel: string | null;
  actionUrl: string | null;
};

export type StudentHomeProfile = {
  displayName: string;
  familiaProfesional: string | null;
  cicloFormativo: string | null;
  localidadPreferida: string | null;
  modalidadPreferida: OfertaModalidad | null;
  preferenciasCompletas: boolean;
};

export type StudentHomeFeed = {
  student: StudentHomeProfile;
  recommendedOffers: RecommendedHomeOffer[];
  peerActivity: PeerActivityItem[];
  announcements: HomeAnnouncement[];
};
