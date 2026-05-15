package com.fctnow.backend.solicitudes.externas;

import com.fctnow.backend.asignaciones.externas.AsignacionFctExternaRepository;
import com.fctnow.backend.notificaciones.NotificacionService;
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
public class SolicitudExternaService {

  private static final Set<SolicitudExternaEstado> TRANSITIONS_FROM_SOLICITADA =
      EnumSet.of(SolicitudExternaEstado.ACEPTADA,
          SolicitudExternaEstado.RECHAZADA,
          SolicitudExternaEstado.RETIRADA);
  private static final Set<SolicitudExternaEstado> TRANSITIONS_FROM_ACEPTADA =
      EnumSet.of(SolicitudExternaEstado.RETIRADA);

  private final SolicitudExternaRepository repository;
  private final AsignacionFctExternaRepository asignacionExternaRepository;
  private final UserAccountRepository userAccountRepository;
  private final NotificacionService notificacionService;

  public SolicitudExternaService(
      SolicitudExternaRepository repository,
      AsignacionFctExternaRepository asignacionExternaRepository,
      UserAccountRepository userAccountRepository,
      NotificacionService notificacionService) {
    this.repository = repository;
    this.asignacionExternaRepository = asignacionExternaRepository;
    this.userAccountRepository = userAccountRepository;
    this.notificacionService = notificacionService;
  }

  @Transactional
  public SolicitudExternaResponse create(
      SolicitudExternaCreateRequest request,
      JwtAuthenticationToken authentication) {
    UserAccount alumno = requireAlumno(authentication);

    return repository
        .findByAlumnoIdAndFuenteAndIdExterno(alumno.getId(), request.fuente(), request.idExterno())
        .map(existing -> reactivate(existing, request))
        .orElseGet(() -> createNew(alumno, request));
  }

  @Transactional(readOnly = true)
  public List<SolicitudExternaResponse> findMine(JwtAuthenticationToken authentication) {
    UserAccount alumno = requireAlumno(authentication);
    return repository.findByAlumnoIdWithDetails(alumno.getId()).stream()
        .map(SolicitudExternaResponse::from)
        .toList();
  }

  @Transactional
  public SolicitudExternaResponse changeEstado(
      Long solicitudId,
      SolicitudExternaEstadoChangeRequest request,
      JwtAuthenticationToken authentication) {
    UserAccount alumno = requireAlumno(authentication);
    SolicitudExterna solicitud = repository.findById(solicitudId)
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Solicitud externa no encontrada"));

    if (!solicitud.getAlumno().getId().equals(alumno.getId())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No es tu solicitud");
    }

    SolicitudExternaEstado nuevoEstado = request.estado();
    if (nuevoEstado == solicitud.getEstado()) {
      return SolicitudExternaResponse.from(solicitud);
    }
    if (nuevoEstado == SolicitudExternaEstado.RETIRADA
        && asignacionExternaRepository.existsBySolicitudId(solicitud.getId())) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "No se puede retirar una solicitud externa ya asignada");
    }

    Set<SolicitudExternaEstado> permitidas = transitionsFrom(solicitud.getEstado());
    if (!permitidas.contains(nuevoEstado)) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "Transicion no permitida desde " + solicitud.getEstado() + " a " + nuevoEstado);
    }

    solicitud.changeEstado(nuevoEstado, alumno);
    if (nuevoEstado == SolicitudExternaEstado.ACEPTADA) {
      notificacionService.notifyCentroSolicitudExternaAceptada(solicitud);
    }
    return SolicitudExternaResponse.from(solicitud);
  }

  @Transactional
  public void delete(Long solicitudId, JwtAuthenticationToken authentication) {
    UserAccount alumno = requireAlumno(authentication);
    SolicitudExterna solicitud = repository.findById(solicitudId)
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Solicitud externa no encontrada"));

    if (!solicitud.getAlumno().getId().equals(alumno.getId())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No es tu solicitud");
    }
    if (solicitud.getEstado() != SolicitudExternaEstado.RETIRADA
        && solicitud.getEstado() != SolicitudExternaEstado.RECHAZADA) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "Solo se pueden eliminar solicitudes externas retiradas o rechazadas");
    }
    if (asignacionExternaRepository.existsBySolicitudId(solicitud.getId())) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "No se puede eliminar una solicitud externa ya asignada");
    }

    repository.delete(solicitud);
  }

  private Set<SolicitudExternaEstado> transitionsFrom(SolicitudExternaEstado estado) {
    return switch (estado) {
      case SOLICITADA -> TRANSITIONS_FROM_SOLICITADA;
      case ACEPTADA -> TRANSITIONS_FROM_ACEPTADA;
      case RECHAZADA, RETIRADA -> EnumSet.noneOf(SolicitudExternaEstado.class);
    };
  }

  private SolicitudExternaResponse createNew(UserAccount alumno, SolicitudExternaCreateRequest req) {
    SolicitudExterna solicitud = new SolicitudExterna(
        alumno,
        req.fuente(),
        req.idExterno(),
        req.titulo(),
        req.empresaNombre(),
        req.localidad(),
        req.region(),
        req.urlAplicacion(),
        req.publicadoEn(),
        req.categoria(),
        alumno);
    return SolicitudExternaResponse.from(repository.save(solicitud));
  }

  private SolicitudExternaResponse reactivate(
      SolicitudExterna existing,
      SolicitudExternaCreateRequest req) {
    if (existing.getEstado() == SolicitudExternaEstado.RETIRADA
        || existing.getEstado() == SolicitudExternaEstado.RECHAZADA) {
      existing.refreshSnapshot(
          req.titulo(),
          req.empresaNombre(),
          req.localidad(),
          req.region(),
          req.urlAplicacion(),
          req.publicadoEn(),
          req.categoria());
      existing.changeEstado(SolicitudExternaEstado.SOLICITADA, existing.getAlumno());
      return SolicitudExternaResponse.from(existing);
    }
    return SolicitudExternaResponse.from(existing);
  }

  private UserAccount requireAlumno(JwtAuthenticationToken authentication) {
    UserAccount user = userAccountRepository.findByEmailIgnoreCase(authentication.getName())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesion no valida"));
    if (!user.getRoles().contains(UserRole.ALUMNO)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el alumno puede gestionar sus solicitudes externas");
    }
    return user;
  }
}
