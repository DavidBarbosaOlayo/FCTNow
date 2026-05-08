package com.fctnow.backend.asignaciones;

import com.fctnow.backend.solicitudes.SolicitudEstado;
import com.fctnow.backend.solicitudes.SolicitudFct;
import com.fctnow.backend.solicitudes.SolicitudFctRepository;
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
public class AsignacionFctService {

  private static final Set<UserRole> ROLES_PERMITIDOS =
      EnumSet.of(UserRole.TUTOR_CENTRO, UserRole.COORDINADOR);

  private final AsignacionFctRepository asignacionFctRepository;
  private final SolicitudFctRepository solicitudFctRepository;
  private final UserAccountRepository userAccountRepository;

  public AsignacionFctService(
      AsignacionFctRepository asignacionFctRepository,
      SolicitudFctRepository solicitudFctRepository,
      UserAccountRepository userAccountRepository) {
    this.asignacionFctRepository = asignacionFctRepository;
    this.solicitudFctRepository = solicitudFctRepository;
    this.userAccountRepository = userAccountRepository;
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

    String observaciones = normaliseObservaciones(request.observaciones());
    AsignacionFct asignacion = asignacionFctRepository.save(new AsignacionFct(solicitud, observaciones));
    return AsignacionFctResponse.from(asignacion);
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
