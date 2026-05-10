package com.fctnow.backend.tutor;

import com.fctnow.backend.alumnos.AlumnoPreferencias;
import com.fctnow.backend.alumnos.AlumnoPreferenciasRepository;
import com.fctnow.backend.asignaciones.AsignacionFct;
import com.fctnow.backend.asignaciones.AsignacionFctRepository;
import com.fctnow.backend.asignaciones.externas.AsignacionFctExterna;
import com.fctnow.backend.asignaciones.externas.AsignacionFctExternaRepository;
import com.fctnow.backend.solicitudes.SolicitudEstado;
import com.fctnow.backend.solicitudes.SolicitudFct;
import com.fctnow.backend.solicitudes.SolicitudFctRepository;
import com.fctnow.backend.solicitudes.externas.SolicitudExterna;
import com.fctnow.backend.solicitudes.externas.SolicitudExternaEstado;
import com.fctnow.backend.solicitudes.externas.SolicitudExternaRepository;
import com.fctnow.backend.tutor.TutorAlumnoResponse.AsignacionActual;
import com.fctnow.backend.tutor.TutorAlumnoResponse.Preferencias;
import com.fctnow.backend.tutor.TutorAlumnoResponse.SolicitudesResumen;
import com.fctnow.backend.user.UserAccount;
import com.fctnow.backend.user.UserAccountRepository;
import com.fctnow.backend.user.UserRole;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TutorAlumnoService {

  private static final Set<UserRole> ROLES_PERMITIDOS =
      EnumSet.of(UserRole.TUTOR_CENTRO, UserRole.COORDINADOR);

  private final UserAccountRepository userAccountRepository;
  private final AlumnoPreferenciasRepository preferenciasRepository;
  private final SolicitudFctRepository solicitudFctRepository;
  private final SolicitudExternaRepository solicitudExternaRepository;
  private final AsignacionFctRepository asignacionFctRepository;
  private final AsignacionFctExternaRepository asignacionFctExternaRepository;

  public TutorAlumnoService(
      UserAccountRepository userAccountRepository,
      AlumnoPreferenciasRepository preferenciasRepository,
      SolicitudFctRepository solicitudFctRepository,
      SolicitudExternaRepository solicitudExternaRepository,
      AsignacionFctRepository asignacionFctRepository,
      AsignacionFctExternaRepository asignacionFctExternaRepository) {
    this.userAccountRepository = userAccountRepository;
    this.preferenciasRepository = preferenciasRepository;
    this.solicitudFctRepository = solicitudFctRepository;
    this.solicitudExternaRepository = solicitudExternaRepository;
    this.asignacionFctRepository = asignacionFctRepository;
    this.asignacionFctExternaRepository = asignacionFctExternaRepository;
  }

  @Transactional(readOnly = true)
  public List<TutorAlumnoResponse> findAlumnos(JwtAuthenticationToken authentication) {
    requireCentroRole(authentication);

    List<UserAccount> alumnos = userAccountRepository.findAllByRole(UserRole.ALUMNO).stream()
        .sorted(Comparator.comparing(
            UserAccount::getDisplayName,
            Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
        .toList();
    if (alumnos.isEmpty()) {
      return List.of();
    }

    List<Long> ids = alumnos.stream().map(UserAccount::getId).toList();

    Map<Long, AlumnoPreferencias> preferenciasByAlumno = new HashMap<>();
    for (AlumnoPreferencias p : preferenciasRepository.findByAlumnoIdIn(ids)) {
      preferenciasByAlumno.put(p.getAlumno().getId(), p);
    }

    Map<Long, List<SolicitudFct>> solByAlumno = new HashMap<>();
    for (SolicitudFct s : solicitudFctRepository.findByAlumnoIdIn(ids)) {
      solByAlumno.computeIfAbsent(s.getAlumno().getId(), k -> new java.util.ArrayList<>()).add(s);
    }

    Map<Long, List<SolicitudExterna>> solExtByAlumno = new HashMap<>();
    for (SolicitudExterna s : solicitudExternaRepository.findByAlumnoIdIn(ids)) {
      solExtByAlumno.computeIfAbsent(s.getAlumno().getId(), k -> new java.util.ArrayList<>()).add(s);
    }

    Map<Long, AsignacionFct> asigByAlumno = new HashMap<>();
    for (AsignacionFct a : asignacionFctRepository.findByAlumnoIdInWithDetails(ids)) {
      asigByAlumno.merge(a.getAlumno().getId(), a, (existing, candidate) ->
          candidate.getFechaAsignacion().isAfter(existing.getFechaAsignacion()) ? candidate : existing);
    }

    Map<Long, AsignacionFctExterna> asigExtByAlumno = new HashMap<>();
    for (AsignacionFctExterna a : asignacionFctExternaRepository.findByAlumnoIdInWithDetails(ids)) {
      asigExtByAlumno.merge(a.getAlumno().getId(), a, (existing, candidate) ->
          candidate.getFechaAsignacion().isAfter(existing.getFechaAsignacion()) ? candidate : existing);
    }

    return alumnos.stream()
        .map(alumno -> buildResponse(
            alumno,
            preferenciasByAlumno.get(alumno.getId()),
            solByAlumno.getOrDefault(alumno.getId(), List.of()),
            solExtByAlumno.getOrDefault(alumno.getId(), List.of()),
            asigByAlumno.get(alumno.getId()),
            asigExtByAlumno.get(alumno.getId())))
        .toList();
  }

  private TutorAlumnoResponse buildResponse(
      UserAccount alumno,
      AlumnoPreferencias prefs,
      List<SolicitudFct> sol,
      List<SolicitudExterna> solExt,
      AsignacionFct asig,
      AsignacionFctExterna asigExt) {
    Preferencias preferencias = prefs == null
        ? null
        : new Preferencias(
            prefs.getFamiliaProfesional(),
            prefs.getCicloFormativo(),
            prefs.getLocalidadPreferida(),
            prefs.getModalidadPreferida() == null ? null : prefs.getModalidadPreferida().name(),
            prefs.getFechaDisponibilidad());

    int internalSolicitadas = (int) sol.stream()
        .filter(s -> s.getEstado() == SolicitudEstado.SOLICITADA)
        .count();
    int internalAceptadas = (int) sol.stream()
        .filter(s -> s.getEstado() == SolicitudEstado.ACEPTADA)
        .count();
    int internalRechazadas = (int) sol.stream()
        .filter(s -> s.getEstado() == SolicitudEstado.RECHAZADA)
        .count();

    int externalSolicitadas = (int) solExt.stream()
        .filter(s -> s.getEstado() == SolicitudExternaEstado.SOLICITADA)
        .count();
    int externalAceptadas = (int) solExt.stream()
        .filter(s -> s.getEstado() == SolicitudExternaEstado.ACEPTADA)
        .count();
    int externalRechazadas = (int) solExt.stream()
        .filter(s -> s.getEstado() == SolicitudExternaEstado.RECHAZADA
            || s.getEstado() == SolicitudExternaEstado.RETIRADA)
        .count();

    SolicitudesResumen resumen = new SolicitudesResumen(
        sol.size() + solExt.size(),
        internalSolicitadas + externalSolicitadas,
        internalAceptadas + externalAceptadas,
        internalRechazadas + externalRechazadas);

    AsignacionActual asignacionActual = pickAsignacion(asig, asigExt);

    return new TutorAlumnoResponse(
        alumno.getId(),
        alumno.getEmail(),
        alumno.getDisplayName(),
        alumno.isEnabled(),
        preferencias,
        resumen,
        asignacionActual);
  }

  private AsignacionActual pickAsignacion(AsignacionFct asig, AsignacionFctExterna asigExt) {
    if (asig == null && asigExt == null) {
      return null;
    }
    if (asig != null && asigExt != null) {
      AsignacionFct a = asig;
      AsignacionFctExterna e = asigExt;
      boolean externalNewer =
          Comparator.<java.time.Instant>naturalOrder().compare(
              e.getFechaAsignacion(), a.getFechaAsignacion()) > 0;
      return externalNewer ? toAsignacionActual(e) : toAsignacionActual(a);
    }
    if (asig != null) {
      return toAsignacionActual(asig);
    }
    return toAsignacionActual(asigExt);
  }

  private AsignacionActual toAsignacionActual(AsignacionFct a) {
    return new AsignacionActual(
        a.getId(),
        a.getEstado(),
        a.getFechaAsignacion(),
        a.getOferta().getTitulo(),
        a.getEmpresa().getNombre(),
        a.getObservaciones());
  }

  private AsignacionActual toAsignacionActual(AsignacionFctExterna a) {
    SolicitudExterna s = a.getSolicitud();
    String empresa = s.getEmpresaNombre() == null || s.getEmpresaNombre().isBlank()
        ? "Empresa externa"
        : s.getEmpresaNombre();
    return new AsignacionActual(
        a.getId(),
        a.getEstado(),
        a.getFechaAsignacion(),
        s.getTitulo(),
        empresa,
        a.getObservaciones());
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
          "Solo el personal del centro puede consultar el panel de tutor");
    }
  }
}
