package com.fctnow.backend.notificaciones;

import com.fctnow.backend.ofertas.OfertaEstado;
import com.fctnow.backend.ofertas.OfertaFct;
import com.fctnow.backend.ofertas.OfertaFctRepository;
import com.fctnow.backend.solicitudes.SolicitudEstado;
import com.fctnow.backend.solicitudes.SolicitudFct;
import com.fctnow.backend.solicitudes.externas.SolicitudExterna;
import com.fctnow.backend.user.UserAccount;
import com.fctnow.backend.user.UserAccountRepository;
import com.fctnow.backend.user.UserRole;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class NotificacionService {

  private static final Set<UserRole> ROLES_CENTRO =
      EnumSet.of(UserRole.TUTOR_CENTRO, UserRole.COORDINADOR);

  private final NotificacionRepository notificacionRepository;
  private final UserAccountRepository userAccountRepository;
  private final OfertaFctRepository ofertaFctRepository;

  public NotificacionService(
      NotificacionRepository notificacionRepository,
      UserAccountRepository userAccountRepository,
      OfertaFctRepository ofertaFctRepository) {
    this.notificacionRepository = notificacionRepository;
    this.userAccountRepository = userAccountRepository;
    this.ofertaFctRepository = ofertaFctRepository;
  }

  @Transactional
  public NotificacionResponse createRecomendacion(
      RecomendacionRequest request,
      JwtAuthenticationToken authentication) {
    UserAccount centro = currentUser(authentication);
    requireAnyRole(centro, ROLES_CENTRO, "Solo el personal del centro puede recomendar ofertas");

    UserAccount alumno = userAccountRepository.findById(request.alumnoId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Alumno no encontrado"));
    if (!alumno.getRoles().contains(UserRole.ALUMNO)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El destinatario debe ser alumno");
    }

    boolean hasInternal = request.ofertaId() != null;
    boolean hasExternal = request.ofertaExterna() != null;
    if (hasInternal == hasExternal) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Indica una oferta interna o una oferta externa");
    }

    Notificacion notificacion = hasInternal
        ? buildInternalRecommendation(alumno, centro, request.ofertaId())
        : buildExternalRecommendation(alumno, centro, request.ofertaExterna());

    return NotificacionResponse.from(notificacionRepository.save(notificacion));
  }

  @Transactional(readOnly = true)
  public List<NotificacionResponse> listMine(JwtAuthenticationToken authentication) {
    UserAccount user = currentUser(authentication);
    return notificacionRepository.findByDestinatarioIdWithOfertaOrderByCreatedAtDesc(user.getId()).stream()
        .map(NotificacionResponse::from)
        .toList();
  }

  @Transactional
  public NotificacionResponse marcarLeida(Long id, JwtAuthenticationToken authentication) {
    UserAccount user = currentUser(authentication);
    Notificacion notificacion = notificacionRepository.findByIdAndDestinatarioId(id, user.getId())
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Notificacion no encontrada"));
    notificacion.marcarLeida();
    return NotificacionResponse.from(notificacion);
  }

  @Transactional
  public void delete(Long id, JwtAuthenticationToken authentication) {
    UserAccount user = currentUser(authentication);
    Notificacion notificacion = notificacionRepository.findByIdAndDestinatarioId(id, user.getId())
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Notificacion no encontrada"));
    notificacionRepository.delete(notificacion);
  }

  @Transactional
  public void notifyNuevaSolicitud(SolicitudFct solicitud) {
    userAccountRepository.findAllByRoleAndEmpresaId(
            UserRole.EMPRESA,
            solicitud.getOferta().getEmpresa().getId())
        .forEach(destinatario -> save(
            destinatario,
            solicitud.getAlumno(),
            NotificacionTipo.SOLICITUD_RECIBIDA,
            "Nueva solicitud recibida",
            "%s ha solicitado \"%s\".".formatted(
                solicitud.getAlumno().getDisplayName(),
                solicitud.getOferta().getTitulo()),
            "/empresa/solicitudes",
            "Ver solicitudes",
            solicitud.getOferta()));
  }

  @Transactional
  public void notifyRespuestaSolicitud(SolicitudFct solicitud, SolicitudEstado estado) {
    if (estado != SolicitudEstado.ACEPTADA && estado != SolicitudEstado.RECHAZADA) {
      return;
    }

    boolean aceptada = estado == SolicitudEstado.ACEPTADA;
    save(
        solicitud.getAlumno(),
        null,
        aceptada ? NotificacionTipo.SOLICITUD_ACEPTADA : NotificacionTipo.SOLICITUD_RECHAZADA,
        aceptada ? "Solicitud aceptada" : "Solicitud rechazada",
        "%s ha %s tu solicitud para \"%s\".".formatted(
            solicitud.getOferta().getEmpresa().getNombre(),
            aceptada ? "aceptado" : "rechazado",
            solicitud.getOferta().getTitulo()),
        "/alumno/solicitudes",
        "Ver mis solicitudes",
        solicitud.getOferta());

    if (aceptada) {
      notifyCentroSolicitudAceptada(solicitud);
    }
  }

  @Transactional
  public void notifyAsignacionCreada(SolicitudFct solicitud) {
    clearPendingAssignmentNotifications(solicitud.getAlumno());
    save(
        solicitud.getAlumno(),
        null,
        NotificacionTipo.ASIGNACION_CREADA,
        "Practica asignada",
        "El centro ha asignado tu practica en %s para \"%s\".".formatted(
            solicitud.getOferta().getEmpresa().getNombre(),
            solicitud.getOferta().getTitulo()),
        "/alumno/solicitudes",
        "Ver asignacion",
        solicitud.getOferta());
  }

  @Transactional
  public void clearPendingAssignmentNotifications(UserAccount alumno) {
    notificacionRepository.deleteByTipoAndRecomendadaPorId(
        NotificacionTipo.SOLICITUD_ACEPTADA_PENDIENTE_ASIGNACION,
        alumno.getId());
  }

  @Transactional
  public void notifyOfertaPublicada(OfertaFct oferta) {
    forEachCentro(destinatario -> save(
        destinatario,
        null,
        NotificacionTipo.OFERTA_PUBLICADA,
        "Nueva oferta FCT publicada",
        "%s ha publicado \"%s\" para %s.".formatted(
            oferta.getEmpresa().getNombre(),
            oferta.getTitulo(),
            oferta.getCicloFormativo() == null ? oferta.getFamiliaProfesional() : oferta.getCicloFormativo()),
        "/practicas/" + oferta.getId(),
        "Ver oferta",
        oferta));
  }

  private Notificacion buildInternalRecommendation(
      UserAccount alumno,
      UserAccount centro,
      Long ofertaId) {
    OfertaFct oferta = ofertaFctRepository.findByIdAndEstadoWithEmpresa(ofertaId, OfertaEstado.PUBLICADA)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Oferta no encontrada"));
    if (notificacionRepository.existsByDestinatarioIdAndTipoAndOfertaId(
        alumno.getId(),
        NotificacionTipo.RECOMENDACION,
        oferta.getId())) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "Ya se ha recomendado esta oferta a este alumno");
    }
    String empresa = oferta.getEmpresa().getNombre();
    return new Notificacion(
        alumno,
        centro,
        NotificacionTipo.RECOMENDACION,
        "Oferta FCT recomendada",
        "%s te recomienda solicitar \"%s\" en %s.".formatted(
            centro.getDisplayName(),
            oferta.getTitulo(),
            empresa),
        "/practicas/" + oferta.getId(),
        "Ver oferta",
        oferta,
        null,
        null,
        null,
        null);
  }

  private Notificacion buildExternalRecommendation(
      UserAccount alumno,
      UserAccount centro,
      RecomendacionRequest.OfertaExterna oferta) {
    String empresa = blankToFallback(oferta.empresa(), "Empresa externa");
    String url = oferta.url().trim();
    if (notificacionRepository.existsExternalRecommendation(
        alumno.getId(),
        NotificacionTipo.RECOMENDACION,
        url)) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "Ya se ha recomendado esta oferta a este alumno");
    }
    String localidad = blankToNull(oferta.localidad());
    return new Notificacion(
        alumno,
        centro,
        NotificacionTipo.RECOMENDACION,
        "Oferta externa recomendada",
        "%s te recomienda revisar \"%s\" en %s.".formatted(
            centro.getDisplayName(),
            oferta.titulo(),
            empresa),
        url,
        "Ver oferta externa",
        null,
        oferta.titulo(),
        empresa,
        url,
        localidad);
  }

  private UserAccount currentUser(JwtAuthenticationToken authentication) {
    return userAccountRepository.findByEmailIgnoreCase(authentication.getName())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesion no valida"));
  }

  private void notifyCentroSolicitudAceptada(SolicitudFct solicitud) {
    UserAccount alumno = solicitud.getAlumno();
    String actionUrl = "/tutor?asignar=" + alumno.getId();
    forEachCentro(destinatario -> save(
        destinatario,
        alumno,
        NotificacionTipo.SOLICITUD_ACEPTADA_PENDIENTE_ASIGNACION,
        "Solicitud aceptada pendiente de asignacion",
        "%s ha sido aceptado por %s para \"%s\". Revisa la asignacion de practicas.".formatted(
            alumno.getDisplayName(),
            solicitud.getOferta().getEmpresa().getNombre(),
            solicitud.getOferta().getTitulo()),
        actionUrl,
        "Asignar practica",
        solicitud.getOferta()));
  }

  @Transactional
  public void notifyCentroSolicitudExternaAceptada(SolicitudExterna solicitud) {
    UserAccount alumno = solicitud.getAlumno();
    String empresa = hasText(solicitud.getEmpresaNombre())
        ? solicitud.getEmpresaNombre()
        : "una empresa externa";
    String actionUrl = "/tutor?asignar=" + alumno.getId();
    String titulo = "Solicitud externa aceptada pendiente de asignacion";
    String mensaje = "%s ha sido aceptado por %s para \"%s\". Revisa la asignacion de practicas.".formatted(
        alumno.getDisplayName(),
        empresa,
        solicitud.getTitulo());

    forEachCentro(destinatario -> notificacionRepository.save(new Notificacion(
        destinatario,
        alumno,
        NotificacionTipo.SOLICITUD_ACEPTADA_PENDIENTE_ASIGNACION,
        titulo,
        mensaje,
        actionUrl,
        "Asignar practica",
        null,
        solicitud.getTitulo(),
        solicitud.getEmpresaNombre(),
        solicitud.getUrlAplicacion(),
        solicitud.getLocalidad())));
  }

  private boolean hasText(String value) {
    return value != null && !value.isBlank();
  }

  private void forEachCentro(java.util.function.Consumer<UserAccount> action) {
    ROLES_CENTRO.stream()
        .flatMap(role -> userAccountRepository.findAllByRole(role).stream())
        .distinct()
        .forEach(action);
  }

  private Notificacion save(
      UserAccount destinatario,
      UserAccount actor,
      NotificacionTipo tipo,
      String titulo,
      String mensaje,
      String actionUrl,
      String actionLabel,
      OfertaFct oferta) {
    return notificacionRepository.save(new Notificacion(
        destinatario,
        actor,
        tipo,
        titulo,
        mensaje,
        actionUrl,
        actionLabel,
        oferta,
        null,
        null,
        null,
        null));
  }

  private void requireAnyRole(UserAccount user, Set<UserRole> expectedRoles, String message) {
    if (user.getRoles().stream().noneMatch(expectedRoles::contains)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, message);
    }
  }

  private String blankToFallback(String value, String fallback) {
    String normalized = blankToNull(value);
    return normalized == null ? fallback : normalized;
  }

  private String blankToNull(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    return value.trim();
  }
}
