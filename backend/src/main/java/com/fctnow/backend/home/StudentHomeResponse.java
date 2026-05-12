package com.fctnow.backend.home;

import com.fctnow.backend.ofertas.OfertaModalidad;
import com.fctnow.backend.user.UserRole;
import java.time.Instant;
import java.util.List;

public record StudentHomeResponse(
    StudentHomeProfile student,
    List<RecommendedHomeOffer> recommendedOffers,
    List<PeerActivityItem> peerActivity,
    List<HomeAnnouncement> announcements) {

  public record StudentHomeProfile(
      String displayName,
      String familiaProfesional,
      String cicloFormativo,
      String localidadPreferida,
      OfertaModalidad modalidadPreferida,
      boolean preferenciasCompletas) {
  }

  public record RecommendedHomeOffer(
      String id,
      String source,
      Long offerId,
      String externalUrl,
      String title,
      String company,
      String location,
      OfertaModalidad modality,
      Instant publishedAt,
      String statusLabel,
      List<String> matchReasons) {
  }

  public record PeerActivityItem(
      String id,
      String title,
      String summary,
      String metric,
      String company,
      String studentName,
      String studentPhotoUrl,
      Instant occurredAt,
      String actionUrl) {
  }

  public record HomeAnnouncement(
      String id,
      String kind,
      String title,
      String body,
      String authorName,
      UserRole authorRole,
      Instant publishedAt,
      String actionLabel,
      String actionUrl) {
  }
}
