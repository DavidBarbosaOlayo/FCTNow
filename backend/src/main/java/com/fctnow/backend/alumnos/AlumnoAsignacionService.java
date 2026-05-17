package com.fctnow.backend.alumnos;

import com.fctnow.backend.asignaciones.AsignacionFct;
import com.fctnow.backend.asignaciones.AsignacionFctRepository;
import com.fctnow.backend.asignaciones.AsignacionEstado;
import com.fctnow.backend.asignaciones.externas.AsignacionFctExterna;
import com.fctnow.backend.asignaciones.externas.AsignacionFctExternaRepository;
import com.fctnow.backend.user.UserAccount;
import com.fctnow.backend.user.UserAccountRepository;
import com.fctnow.backend.user.UserRole;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AlumnoAsignacionService {

  private final UserAccountRepository userAccountRepository;
  private final AsignacionFctRepository asignacionFctRepository;
  private final AsignacionFctExternaRepository asignacionFctExternaRepository;

  public AlumnoAsignacionService(
      UserAccountRepository userAccountRepository,
      AsignacionFctRepository asignacionFctRepository,
      AsignacionFctExternaRepository asignacionFctExternaRepository) {
    this.userAccountRepository = userAccountRepository;
    this.asignacionFctRepository = asignacionFctRepository;
    this.asignacionFctExternaRepository = asignacionFctExternaRepository;
  }

  @Transactional(readOnly = true)
  public Optional<AlumnoAsignacionResponse> findActual(JwtAuthenticationToken authentication) {
    UserAccount alumno = currentAlumno(authentication);
    Optional<AsignacionFct> interna = asignacionFctRepository
        .findFirstByAlumnoIdAndEstadoWithDetails(alumno.getId(), AsignacionEstado.ACTIVA);
    Optional<AsignacionFctExterna> externa =
        asignacionFctExternaRepository
            .findFirstByAlumnoIdAndEstadoWithDetails(alumno.getId(), AsignacionEstado.ACTIVA);

    if (interna.isPresent() && externa.isPresent()) {
      AsignacionFct intAsignacion = interna.get();
      AsignacionFctExterna extAsignacion = externa.get();
      boolean externalNewer = extAsignacion.getFechaAsignacion().isAfter(intAsignacion.getFechaAsignacion());
      return Optional.of(externalNewer
          ? AlumnoAsignacionResponse.from(extAsignacion)
          : AlumnoAsignacionResponse.from(intAsignacion));
    }

    return interna
        .map(AlumnoAsignacionResponse::from)
        .or(() -> externa.map(AlumnoAsignacionResponse::from));
  }

  private UserAccount currentAlumno(JwtAuthenticationToken authentication) {
    UserAccount userAccount = userAccountRepository.findByEmailIgnoreCase(authentication.getName())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesion no valida"));

    if (!userAccount.getRoles().contains(UserRole.ALUMNO)) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          "Solo los alumnos pueden consultar su asignacion");
    }

    return userAccount;
  }
}
