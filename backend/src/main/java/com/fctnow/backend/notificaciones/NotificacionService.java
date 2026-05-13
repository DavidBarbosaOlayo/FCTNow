package com.fctnow.backend.notificaciones;

import com.fctnow.backend.ofertas.OfertaEstado;
import com.fctnow.backend.ofertas.OfertaFct;
import com.fctnow.backend.ofertas.OfertaFctRepository;
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
    UserAccount alumno = currentUser(authentication);
    requireAnyRole(alumno, Set.of(UserRole.ALUMNO), "Solo los alumnos pueden ver sus notificaciones");
    return notificacionRepository.findByAlumnoIdWithOfertaOrderByCreatedAtDesc(alumno.getId()).stream()
        .map(NotificacionResponse::from)
        .toList();
  }

  @Transactional
  public NotificacionResponse marcarLeida(Long id, JwtAuthenticationToken authentication) {
    UserAccount alumno = currentUser(authentication);
    requireAnyRole(alumno, Set.of(UserRole.ALUMNO), "Solo los alumnos pueden marcar notificaciones");
    Notificacion notificacion = notificacionRepository.findByIdAndAlumnoId(id, alumno.getId())
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Notificacion no encontrada"));
    notificacion.marcarLeida();
    return NotificacionResponse.from(notificacion);
  }

  @Transactional
  public void delete(Long id, JwtAuthenticationToken authentication) {
    UserAccount alumno = currentUser(authentication);
    requireAnyRole(alumno, Set.of(UserRole.ALUMNO), "Solo los alumnos pueden eliminar notificaciones");
    Notificacion notificacion = notificacionRepository.findByIdAndAlumnoId(id, alumno.getId())
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Notificacion no encontrada"));
    notificacionRepository.delete(notificacion);
  }

  private Notificacion buildInternalRecommendation(
      UserAccount alumno,
      UserAccount centro,
      Long ofertaId) {
    OfertaFct oferta = ofertaFctRepository.findByIdAndEstadoWithEmpresa(ofertaId, OfertaEstado.PUBLICADA)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Oferta no encontrada"));
    if (notificacionRepository.existsByAlumnoIdAndTipoAndOfertaId(
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
