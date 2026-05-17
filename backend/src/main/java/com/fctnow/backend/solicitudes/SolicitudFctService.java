package com.fctnow.backend.solicitudes;

import com.fctnow.backend.asignaciones.AsignacionFct;
import com.fctnow.backend.asignaciones.AsignacionFctRepository;
import com.fctnow.backend.notificaciones.NotificacionService;
import com.fctnow.backend.ofertas.OfertaEstado;
import com.fctnow.backend.ofertas.OfertaFct;
import com.fctnow.backend.ofertas.OfertaFctRepository;
import com.fctnow.backend.user.UserAccount;
import com.fctnow.backend.user.UserAccountRepository;
import com.fctnow.backend.user.UserRole;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SolicitudFctService {

  private final SolicitudFctRepository solicitudFctRepository;
  private final OfertaFctRepository ofertaFctRepository;
  private final UserAccountRepository userAccountRepository;
  private final AsignacionFctRepository asignacionFctRepository;
  private final NotificacionService notificacionService;

  public SolicitudFctService(
      SolicitudFctRepository solicitudFctRepository,
      OfertaFctRepository ofertaFctRepository,
      UserAccountRepository userAccountRepository,
      AsignacionFctRepository asignacionFctRepository,
      NotificacionService notificacionService) {
    this.solicitudFctRepository = solicitudFctRepository;
    this.ofertaFctRepository = ofertaFctRepository;
    this.userAccountRepository = userAccountRepository;
    this.asignacionFctRepository = asignacionFctRepository;
    this.notificacionService = notificacionService;
  }

  public List<SolicitudFctResponse> findMine(JwtAuthenticationToken authentication) {
    UserAccount alumno = currentAlumno(authentication);

    List<SolicitudFct> solicitudes = solicitudFctRepository.findByAlumnoIdWithOferta(alumno.getId());
    if (solicitudes.isEmpty()) {
      return List.of();
    }

    List<Long> ids = solicitudes.stream().map(SolicitudFct::getId).toList();
    Map<Long, AsignacionFct> asigPorSolicitud = asignacionFctRepository.findBySolicitudIdIn(ids).stream()
        .collect(Collectors.toMap(
            a -> a.getSolicitud().getId(),
            a -> a,
            (a, b) -> a));

    return solicitudes.stream()
        .map(s -> SolicitudFctResponse.from(s, asigPorSolicitud.get(s.getId())))
        .toList();
  }

  public SolicitudFctResponse requestOffer(Long ofertaId, JwtAuthenticationToken authentication) {
    UserAccount alumno = currentAlumno(authentication);
    OfertaFct oferta = ofertaFctRepository.findByIdAndEstadoWithEmpresa(
            ofertaId,
            OfertaEstado.PUBLICADA)
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Oferta no encontrada"));

    if (solicitudFctRepository.existsByAlumnoIdAndOfertaId(alumno.getId(), oferta.getId())) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "Ya has solicitado esta oferta");
    }

    SolicitudFct solicitud = solicitudFctRepository.save(new SolicitudFct(alumno, oferta));
    notificacionService.notifyNuevaSolicitud(solicitud);
    return SolicitudFctResponse.from(solicitud);
  }

  private UserAccount currentAlumno(JwtAuthenticationToken authentication) {
    UserAccount userAccount = userAccountRepository.findByEmailIgnoreCase(authentication.getName())
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.UNAUTHORIZED,
            "Sesion no valida"));

    if (!userAccount.getRoles().contains(UserRole.ALUMNO)) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          "Solo los alumnos pueden solicitar ofertas FCT");
    }

    return userAccount;
  }
}
