package com.fctnow.backend.solicitudes;

import com.fctnow.backend.notificaciones.NotificacionService;
import com.fctnow.backend.user.UserAccount;
import com.fctnow.backend.user.UserAccountRepository;
import com.fctnow.backend.user.UserRole;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EmpresaSolicitudService {

  private static final Map<SolicitudEstado, Set<SolicitudEstado>> ALLOWED_TRANSITIONS =
      new EnumMap<>(SolicitudEstado.class);

  static {
    ALLOWED_TRANSITIONS.put(
        SolicitudEstado.SOLICITADA,
        EnumSet.of(SolicitudEstado.ACEPTADA, SolicitudEstado.RECHAZADA));
  }

  private final SolicitudFctRepository solicitudFctRepository;
  private final UserAccountRepository userAccountRepository;
  private final NotificacionService notificacionService;

  public EmpresaSolicitudService(
      SolicitudFctRepository solicitudFctRepository,
      UserAccountRepository userAccountRepository,
      NotificacionService notificacionService) {
    this.solicitudFctRepository = solicitudFctRepository;
    this.userAccountRepository = userAccountRepository;
    this.notificacionService = notificacionService;
  }

  @Transactional(readOnly = true)
  public List<EmpresaSolicitudResponse> findMine(JwtAuthenticationToken authentication) {
    Long empresaId = currentEmpresaId(authentication);

    return solicitudFctRepository.findByEmpresaIdWithDetails(empresaId).stream()
        .map(EmpresaSolicitudResponse::from)
        .toList();
  }

  @Transactional
  public EmpresaSolicitudResponse changeEstado(
      Long id,
      SolicitudEstadoChangeRequest request,
      JwtAuthenticationToken authentication) {
    Long empresaId = currentEmpresaId(authentication);
    SolicitudFct solicitud = solicitudFctRepository.findByIdAndEmpresaIdWithDetails(id, empresaId)
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Solicitud no encontrada"));

    SolicitudEstado actual = solicitud.getEstado();
    SolicitudEstado destino = request.estado();

    if (actual == destino) {
      return EmpresaSolicitudResponse.from(solicitud);
    }

    Set<SolicitudEstado> allowed = ALLOWED_TRANSITIONS.getOrDefault(actual, EnumSet.noneOf(SolicitudEstado.class));
    if (!allowed.contains(destino)) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "Transicion de estado no permitida: " + actual + " -> " + destino);
    }

    solicitud.changeEstado(destino);
    notificacionService.notifyRespuestaSolicitud(solicitud, destino);
    return EmpresaSolicitudResponse.from(solicitud);
  }

  private Long currentEmpresaId(JwtAuthenticationToken authentication) {
    UserAccount userAccount = userAccountRepository.findByEmailIgnoreCase(authentication.getName())
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.UNAUTHORIZED,
            "Sesion no valida"));

    if (!userAccount.getRoles().contains(UserRole.EMPRESA)) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          "Solo las empresas pueden gestionar solicitudes recibidas");
    }

    Long empresaId = userAccount.getEmpresaId();
    if (empresaId == null) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          "El usuario no esta vinculado a ninguna empresa");
    }

    return empresaId;
  }
}
