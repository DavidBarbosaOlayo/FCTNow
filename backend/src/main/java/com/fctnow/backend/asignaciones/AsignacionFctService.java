package com.fctnow.backend.asignaciones;

import com.fctnow.backend.solicitudes.SolicitudEstado;
import com.fctnow.backend.solicitudes.SolicitudFct;
import com.fctnow.backend.solicitudes.SolicitudFctRepository;
import com.fctnow.backend.asignaciones.externas.AsignacionFctExternaRepository;
import com.fctnow.backend.notificaciones.NotificacionService;
import com.fctnow.backend.user.UserAccount;
import com.fctnow.backend.user.UserAccountRepository;
import com.fctnow.backend.user.UserRole;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AsignacionFctService {

  private static final Set<UserRole> ROLES_PERMITIDOS =
      EnumSet.of(UserRole.TUTOR_CENTRO, UserRole.COORDINADOR);
  private static final int MAX_FECHA_INICIO_DAYS_IN_PAST = 30;
  private static final int MAX_FECHA_INICIO_DAYS_IN_FUTURE = 365;

  private final AsignacionFctRepository asignacionFctRepository;
  private final AsignacionFctExternaRepository asignacionFctExternaRepository;
  private final SolicitudFctRepository solicitudFctRepository;
  private final UserAccountRepository userAccountRepository;
  private final NotificacionService notificacionService;

  public AsignacionFctService(
      AsignacionFctRepository asignacionFctRepository,
      AsignacionFctExternaRepository asignacionFctExternaRepository,
      SolicitudFctRepository solicitudFctRepository,
      UserAccountRepository userAccountRepository,
      NotificacionService notificacionService) {
    this.asignacionFctRepository = asignacionFctRepository;
    this.asignacionFctExternaRepository = asignacionFctExternaRepository;
    this.solicitudFctRepository = solicitudFctRepository;
    this.userAccountRepository = userAccountRepository;
    this.notificacionService = notificacionService;
  }

  @Transactional(readOnly = true)
  public List<AsignacionFctResponse> findAll(JwtAuthenticationToken authentication) {
    requireCentroRole(authentication);
    return asignacionFctRepository.findAllWithDetails().stream()
        .map(AsignacionFctResponse::from)
        .toList();
  }

  @Transactional(readOnly = true)
  public List<AsignacionCandidataResponse> findCandidatas(JwtAuthenticationToken authentication) {
    requireCentroRole(authentication);
    return solicitudFctRepository.findAceptadasSinAsignacion().stream()
        .map(AsignacionCandidataResponse::from)
        .toList();
  }

  @Transactional
  public AsignacionFctResponse create(
      AsignacionCreateRequest request,
      JwtAuthenticationToken authentication) {
    requireCentroRole(authentication);

    SolicitudFct solicitud = solicitudFctRepository.findById(request.solicitudId())
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Solicitud no encontrada"));

    if (solicitud.getEstado() != SolicitudEstado.ACEPTADA) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "Solo se pueden asignar solicitudes en estado ACEPTADA");
    }

    if (asignacionFctRepository.existsBySolicitudId(solicitud.getId())) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "Ya existe una asignacion para esta solicitud");
    }

    Long alumnoId = solicitud.getAlumno().getId();
    if (asignacionFctRepository.existsByAlumnoIdAndEstado(alumnoId, AsignacionEstado.ACTIVA)
        || asignacionFctExternaRepository.existsByAlumnoIdAndEstado(alumnoId, AsignacionEstado.ACTIVA)) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "El alumno ya tiene una asignacion activa");
    }

    validateFechaInicio(request.fechaInicio());
    BigDecimal importe = normaliseImporte(request.importeMensual(), request.remunerada());
    String observaciones = normaliseObservaciones(request.observaciones());
    String observacionesRetribucion = normaliseObservaciones(request.observacionesRetribucion());

    AsignacionFct asignacion = asignacionFctRepository.save(new AsignacionFct(
        solicitud,
        observaciones,
        request.horasTotales(),
        request.fechaInicio(),
        request.horasDiariasEstimadas(),
        request.remunerada(),
        importe,
        observacionesRetribucion));
    notificacionService.notifyAsignacionCreada(solicitud);
    return AsignacionFctResponse.from(asignacion);
  }

  public static void validateFechaInicio(LocalDate fechaInicio) {
    LocalDate today = LocalDate.now();
    if (fechaInicio.isBefore(today.minusDays(MAX_FECHA_INICIO_DAYS_IN_PAST))) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "La fecha de inicio no puede ser anterior a " + MAX_FECHA_INICIO_DAYS_IN_PAST + " dias");
    }
    if (fechaInicio.isAfter(today.plusDays(MAX_FECHA_INICIO_DAYS_IN_FUTURE))) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "La fecha de inicio no puede ser posterior a un ano");
    }
  }

  public static BigDecimal normaliseImporte(BigDecimal importe, boolean remunerada) {
    if (importe == null) {
      return null;
    }
    if (!remunerada) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "No se puede indicar importe si la practica no es remunerada");
    }
    return importe;
  }

  private String normaliseObservaciones(String observaciones) {
    if (observaciones == null) {
      return null;
    }
    String trimmed = observaciones.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }

  private void requireCentroRole(JwtAuthenticationToken authentication) {
    UserAccount userAccount = userAccountRepository.findByEmailIgnoreCase(authentication.getName())
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.UNAUTHORIZED,
            "Sesion no valida"));

    boolean tieneRol = userAccount.getRoles().stream().anyMatch(ROLES_PERMITIDOS::contains);
    if (!tieneRol) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          "Solo el personal del centro puede gestionar asignaciones");
    }
  }
}
