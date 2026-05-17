package com.fctnow.backend.asignaciones.externas;

import com.fctnow.backend.asignaciones.AsignacionEstado;
import com.fctnow.backend.asignaciones.AsignacionFctRepository;
import com.fctnow.backend.asignaciones.AsignacionFctService;
import com.fctnow.backend.notificaciones.NotificacionService;
import java.math.BigDecimal;
import com.fctnow.backend.solicitudes.externas.SolicitudExterna;
import com.fctnow.backend.solicitudes.externas.SolicitudExternaEstado;
import com.fctnow.backend.solicitudes.externas.SolicitudExternaRepository;
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
public class AsignacionFctExternaService {

  private static final Set<UserRole> ROLES_PERMITIDOS =
      EnumSet.of(UserRole.TUTOR_CENTRO, UserRole.COORDINADOR);

  private final AsignacionFctExternaRepository repository;
  private final AsignacionFctRepository asignacionFctRepository;
  private final SolicitudExternaRepository solicitudRepository;
  private final UserAccountRepository userAccountRepository;
  private final NotificacionService notificacionService;

  public AsignacionFctExternaService(
      AsignacionFctExternaRepository repository,
      AsignacionFctRepository asignacionFctRepository,
      SolicitudExternaRepository solicitudRepository,
      UserAccountRepository userAccountRepository,
      NotificacionService notificacionService) {
    this.repository = repository;
    this.asignacionFctRepository = asignacionFctRepository;
    this.solicitudRepository = solicitudRepository;
    this.userAccountRepository = userAccountRepository;
    this.notificacionService = notificacionService;
  }

  @Transactional(readOnly = true)
  public List<AsignacionFctExternaResponse> findAll(JwtAuthenticationToken authentication) {
    requireCentroRole(authentication);
    return repository.findAllWithDetails().stream()
        .map(AsignacionFctExternaResponse::from)
        .toList();
  }

  @Transactional(readOnly = true)
  public List<AsignacionExternaCandidataResponse> findCandidatas(JwtAuthenticationToken authentication) {
    requireCentroRole(authentication);
    return solicitudRepository.findAceptadasSinAsignacion().stream()
        .map(AsignacionExternaCandidataResponse::from)
        .toList();
  }

  @Transactional
  public AsignacionFctExternaResponse create(
      AsignacionExternaCreateRequest request,
      JwtAuthenticationToken authentication) {
    requireCentroRole(authentication);

    SolicitudExterna solicitud = solicitudRepository.findById(request.solicitudExternaId())
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Solicitud externa no encontrada"));

    if (solicitud.getEstado() != SolicitudExternaEstado.ACEPTADA) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "Solo se pueden asignar solicitudes externas en estado ACEPTADA");
    }

    if (repository.existsBySolicitudId(solicitud.getId())) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "Ya existe una asignacion para esta solicitud externa");
    }

    Long alumnoId = solicitud.getAlumno().getId();
    if (repository.existsByAlumnoIdAndEstado(alumnoId, AsignacionEstado.ACTIVA)
        || asignacionFctRepository.existsByAlumnoIdAndEstado(alumnoId, AsignacionEstado.ACTIVA)) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "El alumno ya tiene una asignacion activa");
    }

    AsignacionFctService.validateFechaInicio(request.fechaInicio());
    BigDecimal importe = AsignacionFctService.normaliseImporte(request.importeMensual(), request.remunerada());
    AsignacionFctExterna asignacion = repository.save(new AsignacionFctExterna(
        solicitud,
        normaliseObservaciones(request.observaciones()),
        request.horasTotales(),
        request.fechaInicio(),
        request.horasDiariasEstimadas(),
        request.remunerada(),
        importe,
        normaliseObservaciones(request.observacionesRetribucion())));
    notificacionService.notifyAsignacionExternaCreada(solicitud);
    return AsignacionFctExternaResponse.from(asignacion);
  }

  private String normaliseObservaciones(String observaciones) {
    if (observaciones == null) {
      return null;
    }
    String trimmed = observaciones.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }

  private void requireCentroRole(JwtAuthenticationToken authentication) {
    UserAccount user = userAccountRepository.findByEmailIgnoreCase(authentication.getName())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesion no valida"));
    boolean tieneRol = user.getRoles().stream().anyMatch(ROLES_PERMITIDOS::contains);
    if (!tieneRol) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          "Solo el personal del centro puede gestionar asignaciones externas");
    }
  }
}
