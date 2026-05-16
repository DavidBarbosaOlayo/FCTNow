package com.fctnow.backend.home;

import com.fctnow.backend.alumnos.AlumnoPreferencias;
import com.fctnow.backend.alumnos.AlumnoPreferenciasRepository;
import com.fctnow.backend.alumnos.AlumnoPreferenciasResponse;
import com.fctnow.backend.asignaciones.AsignacionEstado;
import com.fctnow.backend.asignaciones.AsignacionFct;
import com.fctnow.backend.asignaciones.AsignacionFctRepository;
import com.fctnow.backend.asignaciones.externas.AsignacionFctExterna;
import com.fctnow.backend.asignaciones.externas.AsignacionFctExternaRepository;
import com.fctnow.backend.home.StudentHomeResponse.HomeAnnouncement;
import com.fctnow.backend.home.StudentHomeResponse.PeerActivityItem;
import com.fctnow.backend.home.StudentHomeResponse.RecommendedHomeOffer;
import com.fctnow.backend.home.StudentHomeResponse.StudentHomeProfile;
import com.fctnow.backend.notificaciones.Notificacion;
import com.fctnow.backend.notificaciones.NotificacionRepository;
import com.fctnow.backend.ofertas.OfertaFct;
import com.fctnow.backend.ofertas.externas.AdzunaService;
import com.fctnow.backend.ofertas.externas.AdzunaUnavailableException;
import com.fctnow.backend.ofertas.externas.OfertaExternaPageResponse;
import com.fctnow.backend.ofertas.externas.OfertaExternaResponse;
import com.fctnow.backend.solicitudes.SolicitudFct;
import com.fctnow.backend.solicitudes.SolicitudFctRepository;
import com.fctnow.backend.solicitudes.externas.SolicitudExterna;
import com.fctnow.backend.solicitudes.externas.SolicitudExternaRepository;
import com.fctnow.backend.user.UserAccount;
import com.fctnow.backend.user.UserAccountRepository;
import com.fctnow.backend.user.UserRole;
import java.text.Normalizer;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class StudentHomeService {

  private static final int HOME_EXTERNAL_RESULTS = 25;
  private static final int HOME_TOP_RECOMMENDATIONS = 5;
  private static final String EXTERNAL_SOURCE = "EXTERNA";
  private static final Map<String, String> ADZUNA_CATEGORY_BY_FAMILIA = Map.ofEntries(
      Map.entry("informatica y comunicaciones", "it-jobs"),
      Map.entry("administracion y gestion", "admin-jobs"),
      Map.entry("comercio y marketing", "pr-advertising-marketing-jobs"),
      Map.entry("sanidad", "healthcare-nursing-jobs"),
      Map.entry("hosteleria y turismo", "hospitality-catering-jobs"),
      Map.entry("servicios socioculturales y a la comunidad", "social-work-jobs"),
      Map.entry("imagen y sonido", "creative-design-jobs"),
      Map.entry("edificacion y obra civil", "trade-construction-jobs"),
      Map.entry("electricidad y electronica", "engineering-jobs"),
      Map.entry("energia y agua", "energy-oil-gas-jobs"),
      Map.entry("fabricacion mecanica", "manufacturing-jobs"),
      Map.entry("industrias alimentarias", "manufacturing-jobs"),
      Map.entry("instalacion y mantenimiento", "maintenance-jobs"),
      Map.entry("quimica", "scientific-qa-jobs"),
      Map.entry("transporte y mantenimiento de vehiculos", "logistics-warehouse-jobs"),
      Map.entry("artes graficas", "creative-design-jobs"));

  private final UserAccountRepository userAccountRepository;
  private final AlumnoPreferenciasRepository preferenciasRepository;
  private final AdzunaService adzunaService;
  private final SolicitudFctRepository solicitudRepository;
  private final SolicitudExternaRepository solicitudExternaRepository;
  private final NotificacionRepository notificacionRepository;
  private final AsignacionFctRepository asignacionRepository;
  private final AsignacionFctExternaRepository asignacionExternaRepository;

  public StudentHomeService(
      UserAccountRepository userAccountRepository,
      AlumnoPreferenciasRepository preferenciasRepository,
      AdzunaService adzunaService,
      SolicitudFctRepository solicitudRepository,
      SolicitudExternaRepository solicitudExternaRepository,
      NotificacionRepository notificacionRepository,
      AsignacionFctRepository asignacionRepository,
      AsignacionFctExternaRepository asignacionExternaRepository) {
    this.userAccountRepository = userAccountRepository;
    this.preferenciasRepository = preferenciasRepository;
    this.adzunaService = adzunaService;
    this.solicitudRepository = solicitudRepository;
    this.solicitudExternaRepository = solicitudExternaRepository;
    this.notificacionRepository = notificacionRepository;
    this.asignacionRepository = asignacionRepository;
    this.asignacionExternaRepository = asignacionExternaRepository;
  }

  @Transactional(readOnly = true)
  public StudentHomeResponse findMine(JwtAuthenticationToken authentication) {
    UserAccount alumno = currentAlumno(authentication);
    AlumnoPreferencias preferencias = preferenciasRepository.findByAlumnoId(alumno.getId()).orElse(null);

    return new StudentHomeResponse(
        profile(alumno, preferencias),
        recommendedOffers(preferencias),
        peerActivity(alumno, preferencias),
        announcements(alumno, preferencias));
  }

  private StudentHomeProfile profile(UserAccount alumno, AlumnoPreferencias preferencias) {
    return new StudentHomeProfile(
        alumno.getDisplayName(),
        preferencias == null ? null : preferencias.getFamiliaProfesional(),
        preferencias == null ? null : preferencias.getCicloFormativo(),
        preferencias == null ? null : preferencias.getLocalidadPreferida(),
        preferencias == null ? null : preferencias.getModalidadPreferida(),
        hasEnoughPreferences(preferencias));
  }

  private List<RecommendedHomeOffer> recommendedOffers(AlumnoPreferencias preferencias) {
    if (!hasText(preferencias == null ? null : preferencias.getFamiliaProfesional())) {
      return List.of();
    }

    try {
      return searchRecommendedOffers(preferencias).stream()
          .sorted(recommendedOfferComparator(preferencias))
          .limit(HOME_TOP_RECOMMENDATIONS)
          .map(oferta -> recommendedOffer(oferta, preferencias))
          .toList();
    } catch (AdzunaUnavailableException ex) {
      return List.of();
    }
  }

  private RecommendedHomeOffer recommendedOffer(
      OfertaExternaResponse oferta,
      AlumnoPreferencias preferencias) {
    return new RecommendedHomeOffer(
        "external-" + oferta.id(),
        EXTERNAL_SOURCE,
        null,
        oferta.urlAplicacion(),
        oferta.titulo(),
        hasText(oferta.empresaNombre()) ? oferta.empresaNombre() : "Empresa externa",
        locationLabel(oferta),
        null,
        oferta.publicadoEn(),
        "Solicitar en Adzuna",
        matchReasons(oferta, preferencias));
  }

  private List<PeerActivityItem> peerActivity(UserAccount alumno, AlumnoPreferencias preferencias) {
    List<SolicitudFct> internas = solicitudRepository.findRecentAceptadasWithDetails().stream()
        .filter(s -> !s.getAlumno().getId().equals(alumno.getId()))
        .filter(s -> sameTrainingContext(
            s.getOferta().getCicloFormativo(),
            s.getOferta().getFamiliaProfesional(),
            preferencias))
        .limit(10)
        .toList();

    List<SolicitudExterna> externasCandidatas = solicitudExternaRepository.findRecentAceptadasWithDetails().stream()
        .filter(s -> !s.getAlumno().getId().equals(alumno.getId()))
        .limit(20)
        .toList();

    if (internas.isEmpty() && externasCandidatas.isEmpty()) {
      return List.of();
    }

    Set<Long> peerIds = new HashSet<>();
    internas.forEach(s -> peerIds.add(s.getAlumno().getId()));
    externasCandidatas.forEach(s -> peerIds.add(s.getAlumno().getId()));

    Map<Long, AlumnoPreferencias> peerPreferences = peerIds.isEmpty()
        ? Map.of()
        : preferenciasRepository.findByAlumnoIdIn(peerIds).stream()
            .collect(Collectors.toMap(p -> p.getAlumno().getId(), p -> p, (a, b) -> a));

    List<SolicitudExterna> externas = externasCandidatas.stream()
        .filter(s -> matchesFamily(peerPreferences.get(s.getAlumno().getId()), preferencias))
        .toList();

    List<DatedPeer> all = new ArrayList<>();
    for (SolicitudFct s : internas) {
      all.add(new DatedPeer(
          s.getCreatedAt(),
          peerActivityItemInternal(s, peerPreferences.get(s.getAlumno().getId()))));
    }
    for (SolicitudExterna s : externas) {
      all.add(new DatedPeer(
          s.getUpdatedAt(),
          peerActivityItemExternal(s, peerPreferences.get(s.getAlumno().getId()))));
    }

    return all.stream()
        .sorted(Comparator.comparing(
            DatedPeer::date,
            Comparator.nullsLast(Comparator.reverseOrder())))
        .limit(3)
        .map(DatedPeer::item)
        .toList();
  }

  private PeerActivityItem peerActivityItemInternal(SolicitudFct solicitud, AlumnoPreferencias peerPreferencias) {
    OfertaFct oferta = solicitud.getOferta();
    String studentName = solicitud.getAlumno().getDisplayName();
    String empresa = oferta.getEmpresa().getNombre();
    return new PeerActivityItem(
        "accepted-int-" + solicitud.getId(),
        studentName + " ha conseguido prácticas en " + empresa,
        "Échale un vistazo a la empresa por si tiene más plazas disponibles para tu ciclo.",
        "Oferta interna aceptada",
        empresa,
        studentName,
        AlumnoPreferenciasResponse.photoDataUrl(peerPreferencias),
        solicitud.getCreatedAt(),
        "/practicas/" + oferta.getId());
  }

  private PeerActivityItem peerActivityItemExternal(SolicitudExterna solicitud, AlumnoPreferencias peerPreferencias) {
    String studentName = solicitud.getAlumno().getDisplayName();
    String empresa = hasText(solicitud.getEmpresaNombre()) ? solicitud.getEmpresaNombre() : "empresa externa";
    return new PeerActivityItem(
        "accepted-ext-" + solicitud.getId(),
        studentName + " ha conseguido prácticas en " + empresa,
        "Échale un vistazo a la oferta por si la empresa tiene más plazas disponibles.",
        "Oferta externa aceptada",
        empresa,
        studentName,
        AlumnoPreferenciasResponse.photoDataUrl(peerPreferencias),
        solicitud.getUpdatedAt(),
        solicitud.getUrlAplicacion());
  }

  private List<HomeAnnouncement> announcements(UserAccount alumno, AlumnoPreferencias preferencias) {
    List<DatedAnnouncement> all = new ArrayList<>();

    notificacionRepository.findByAlumnoIdWithOfertaOrderByCreatedAtDesc(alumno.getId()).stream()
        .filter(this::isCenterAnnouncement)
        .limit(10)
        .forEach(n -> all.add(new DatedAnnouncement(n.getCreatedAt(), notificationAnnouncement(n))));

    if (preferencias != null && hasText(preferencias.getFamiliaProfesional())) {
      List<AsignacionFct> internas = asignacionRepository.findAllWithDetails().stream()
          .filter(a -> !a.getAlumno().getId().equals(alumno.getId()))
          .limit(20)
          .toList();

      List<AsignacionFctExterna> externas = asignacionExternaRepository.findAllWithDetails().stream()
          .filter(a -> !a.getAlumno().getId().equals(alumno.getId()))
          .limit(20)
          .toList();

      Set<Long> peerIds = new HashSet<>();
      internas.forEach(a -> peerIds.add(a.getAlumno().getId()));
      externas.forEach(a -> peerIds.add(a.getAlumno().getId()));

      Map<Long, AlumnoPreferencias> peerPreferences = peerIds.isEmpty()
          ? Map.of()
          : preferenciasRepository.findByAlumnoIdIn(peerIds).stream()
              .collect(Collectors.toMap(p -> p.getAlumno().getId(), p -> p, (a, b) -> a));

      for (AsignacionFct a : internas) {
        if (matchesFamily(peerPreferences.get(a.getAlumno().getId()), preferencias)) {
          all.add(new DatedAnnouncement(a.getFechaAsignacion(), internalAssignmentAnnouncement(a)));
        }
      }
      for (AsignacionFctExterna a : externas) {
        if (matchesFamily(peerPreferences.get(a.getAlumno().getId()), preferencias)) {
          all.add(new DatedAnnouncement(a.getFechaAsignacion(), externalAssignmentAnnouncement(a)));
        }
      }
    }

    return all.stream()
        .sorted(Comparator.comparing(
            DatedAnnouncement::date,
            Comparator.nullsLast(Comparator.reverseOrder())))
        .limit(3)
        .map(DatedAnnouncement::item)
        .toList();
  }

  private HomeAnnouncement notificationAnnouncement(Notificacion notificacion) {
    UserAccount author = notificacion.getRecomendadaPor();
    UserRole role = author != null && author.getRoles().contains(UserRole.COORDINADOR)
        ? UserRole.COORDINADOR
        : UserRole.TUTOR_CENTRO;

    return new HomeAnnouncement(
        "notification-" + notificacion.getId(),
        "NOTIFICATION",
        notificacion.getTitulo(),
        notificacion.getMensaje(),
        author == null ? "Centro FCT" : author.getDisplayName(),
        role,
        notificacion.getCreatedAt(),
        notificacion.getActionLabel(),
        notificacion.getActionUrl());
  }

  private HomeAnnouncement internalAssignmentAnnouncement(AsignacionFct asignacion) {
    String studentName = asignacion.getAlumno().getDisplayName();
    String empresa = asignacion.getEmpresa().getNombre();
    return new HomeAnnouncement(
        "assignment-int-" + asignacion.getId(),
        "ASSIGNMENT",
        studentName + " asignado a " + empresa,
        "Asignación del centro · " + estadoLabel(asignacion.getEstado()),
        "Tutoría del centro",
        UserRole.TUTOR_CENTRO,
        asignacion.getFechaAsignacion(),
        "Ver oferta",
        "/practicas/" + asignacion.getOferta().getId());
  }

  private HomeAnnouncement externalAssignmentAnnouncement(AsignacionFctExterna asignacion) {
    String studentName = asignacion.getAlumno().getDisplayName();
    SolicitudExterna solicitud = asignacion.getSolicitud();
    String empresa = hasText(solicitud.getEmpresaNombre()) ? solicitud.getEmpresaNombre() : "empresa externa";
    return new HomeAnnouncement(
        "assignment-ext-" + asignacion.getId(),
        "ASSIGNMENT",
        studentName + " asignado a " + empresa,
        "Asignación externa · " + estadoLabel(asignacion.getEstado()),
        "Tutoría del centro",
        UserRole.TUTOR_CENTRO,
        asignacion.getFechaAsignacion(),
        "Solicitar en Adzuna",
        solicitud.getUrlAplicacion());
  }

  private String estadoLabel(AsignacionEstado estado) {
    return switch (estado) {
      case ACTIVA -> "En curso";
      case FINALIZADA -> "Finalizada";
    };
  }

  private boolean matchesFamily(AlumnoPreferencias peerPreferencias, AlumnoPreferencias myPreferencias) {
    if (peerPreferencias == null || myPreferencias == null) {
      return false;
    }
    return sameText(peerPreferencias.getFamiliaProfesional(), myPreferencias.getFamiliaProfesional());
  }

  private record DatedPeer(Instant date, PeerActivityItem item) {
  }

  private record DatedAnnouncement(Instant date, HomeAnnouncement item) {
  }

  private boolean isCenterAnnouncement(Notificacion notificacion) {
    UserAccount author = notificacion.getRecomendadaPor();
    return author != null
        && (author.getRoles().contains(UserRole.TUTOR_CENTRO)
            || author.getRoles().contains(UserRole.COORDINADOR));
  }

  private List<String> matchReasons(OfertaExternaResponse oferta, AlumnoPreferencias preferencias) {
    List<String> reasons = new java.util.ArrayList<>();
    if (familyMatches(oferta, preferencias)) {
      reasons.add("Familia profesional");
    }
    if (locationMatches(oferta, preferencias)) {
      reasons.add("Localidad preferida");
    }
    if (cycleMatches(oferta, preferencias)) {
      reasons.add("Ciclo formativo");
    }
    return reasons.isEmpty() ? List.of("Oferta externa reciente") : reasons;
  }

  private boolean sameTrainingContext(
      String cicloFormativo,
      String familiaProfesional,
      AlumnoPreferencias preferencias) {
    if (preferencias == null) {
      return false;
    }
    return sameText(cicloFormativo, preferencias.getCicloFormativo())
        || sameText(familiaProfesional, preferencias.getFamiliaProfesional());
  }

  private boolean hasEnoughPreferences(AlumnoPreferencias preferencias) {
    return preferencias != null && hasText(preferencias.getFamiliaProfesional());
  }

  private UserAccount currentAlumno(JwtAuthenticationToken authentication) {
    UserAccount userAccount = userAccountRepository.findByEmailIgnoreCase(authentication.getName())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesion no valida"));

    if (!userAccount.getRoles().contains(UserRole.ALUMNO)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo los alumnos pueden ver Inicio");
    }

    return userAccount;
  }

  private boolean sameText(String left, String right) {
    return hasText(left) && hasText(right) && normalize(left).equals(normalize(right));
  }

  private boolean hasText(String value) {
    return value != null && !value.isBlank();
  }

  private List<OfertaExternaResponse> searchRecommendedOffers(AlumnoPreferencias preferencias) {
    LinkedHashMap<String, OfertaExternaResponse> accumulated = new LinkedHashMap<>();
    for (ExternalSearchCriteria search : searchCriteria(preferencias)) {
      OfertaExternaPageResponse response = adzunaService.search(
          search.query(),
          search.where(),
          search.category(),
          1,
          HOME_EXTERNAL_RESULTS);

      for (OfertaExternaResponse oferta : response.results()) {
        accumulated.putIfAbsent(oferta.id(), oferta);
      }

      if (accumulated.size() >= HOME_TOP_RECOMMENDATIONS) {
        break;
      }
    }

    return List.copyOf(accumulated.values());
  }

  private List<ExternalSearchCriteria> searchCriteria(AlumnoPreferencias preferencias) {
    List<ExternalSearchCriteria> searches = new ArrayList<>();
    String familyQuery = familyQuery(preferencias);
    String cycleQuery = cycleQuery(preferencias);
    String location = trimOrNull(preferencias == null ? null : preferencias.getLocalidadPreferida());
    String category = categoryFor(preferencias);

    addSearch(searches, mergeQuery(familyQuery, cycleQuery), location, category);
    addSearch(searches, familyQuery, location, category);
    addSearch(searches, familyQuery, null, category);

    return List.copyOf(new LinkedHashSet<>(searches));
  }

  private void addSearch(
      List<ExternalSearchCriteria> searches,
      String query,
      String where,
      String category) {
    if (!hasText(query) && !hasText(category)) {
      return;
    }
    searches.add(new ExternalSearchCriteria(trimOrNull(query), trimOrNull(where), trimOrNull(category)));
  }

  private Comparator<OfertaExternaResponse> recommendedOfferComparator(AlumnoPreferencias preferencias) {
    return Comparator.comparing(
            (OfertaExternaResponse oferta) -> familyMatches(oferta, preferencias),
            Comparator.reverseOrder())
        .thenComparing(
            oferta -> locationMatches(oferta, preferencias),
            Comparator.reverseOrder())
        .thenComparing(
            oferta -> cycleMatches(oferta, preferencias),
            Comparator.reverseOrder())
        .thenComparing(
            OfertaExternaResponse::publicadoEn,
            Comparator.nullsLast(Comparator.reverseOrder()));
  }

  private String familyQuery(AlumnoPreferencias preferencias) {
    if (preferencias == null || !hasText(preferencias.getFamiliaProfesional())) {
      return null;
    }
    if (categoryFor(preferencias) != null) {
      return null;
    }
    return preferencias.getFamiliaProfesional().trim();
  }

  private String cycleQuery(AlumnoPreferencias preferencias) {
    if (preferencias == null || !hasText(preferencias.getCicloFormativo())) {
      return null;
    }
    return preferencias.getCicloFormativo().trim();
  }

  private String mergeQuery(String primary, String secondary) {
    if (!hasText(primary)) {
      return trimOrNull(secondary);
    }
    if (!hasText(secondary)) {
      return trimOrNull(primary);
    }
    return primary.trim() + " " + secondary.trim();
  }

  private String categoryFor(AlumnoPreferencias preferencias) {
    if (preferencias == null || !hasText(preferencias.getFamiliaProfesional())) {
      return null;
    }
    return ADZUNA_CATEGORY_BY_FAMILIA.get(normalize(preferencias.getFamiliaProfesional()));
  }

  private boolean familyMatches(OfertaExternaResponse oferta, AlumnoPreferencias preferencias) {
    if (preferencias == null || !hasText(preferencias.getFamiliaProfesional())) {
      return false;
    }
    if (categoryFor(preferencias) != null) {
      return true;
    }
    return textContains(oferta.titulo(), preferencias.getFamiliaProfesional())
        || textContains(oferta.descripcion(), preferencias.getFamiliaProfesional())
        || textContains(oferta.categoria(), preferencias.getFamiliaProfesional());
  }

  private boolean cycleMatches(OfertaExternaResponse oferta, AlumnoPreferencias preferencias) {
    if (preferencias == null || !hasText(preferencias.getCicloFormativo())) {
      return false;
    }
    return textContains(oferta.titulo(), preferencias.getCicloFormativo())
        || textContains(oferta.descripcion(), preferencias.getCicloFormativo())
        || textContains(oferta.categoria(), preferencias.getCicloFormativo());
  }

  private boolean locationMatches(OfertaExternaResponse oferta, AlumnoPreferencias preferencias) {
    if (preferencias == null || !hasText(preferencias.getLocalidadPreferida())) {
      return false;
    }
    return sameText(oferta.localidad(), preferencias.getLocalidadPreferida())
        || sameText(oferta.region(), preferencias.getLocalidadPreferida())
        || textContains(oferta.localidad(), preferencias.getLocalidadPreferida())
        || textContains(oferta.region(), preferencias.getLocalidadPreferida());
  }

  private boolean textContains(String source, String expected) {
    return hasText(source) && hasText(expected) && normalize(source).contains(normalize(expected));
  }

  private String locationLabel(OfertaExternaResponse oferta) {
    if (hasText(oferta.localidad()) && hasText(oferta.region())) {
      return oferta.localidad() + ", " + oferta.region();
    }
    if (hasText(oferta.localidad())) {
      return oferta.localidad();
    }
    if (hasText(oferta.region())) {
      return oferta.region();
    }
    return "Ubicación no disponible";
  }

  private String trimOrNull(String value) {
    return hasText(value) ? value.trim() : null;
  }

  private String normalize(String value) {
    String normalized = Normalizer.normalize(value.trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFD);
    return normalized.replaceAll("\\p{M}", "");
  }

  private record ExternalSearchCriteria(
      String query,
      String where,
      String category) {
  }
}
