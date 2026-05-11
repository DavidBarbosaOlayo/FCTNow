package com.fctnow.backend.mensajes;

import com.fctnow.backend.alumnos.AlumnoPreferencias;
import com.fctnow.backend.alumnos.AlumnoPreferenciasRepository;
import com.fctnow.backend.user.UserAccount;
import com.fctnow.backend.user.UserAccountRepository;
import com.fctnow.backend.user.UserRole;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MensajeService {

  private static final Set<UserRole> ROLES_PROFESORADO =
      EnumSet.of(UserRole.TUTOR_CENTRO, UserRole.COORDINADOR);

  private final ConversacionRepository conversacionRepository;
  private final MensajeRepository mensajeRepository;
  private final UserAccountRepository userAccountRepository;
  private final AlumnoPreferenciasRepository alumnoPreferenciasRepository;

  public MensajeService(
      ConversacionRepository conversacionRepository,
      MensajeRepository mensajeRepository,
      UserAccountRepository userAccountRepository,
      AlumnoPreferenciasRepository alumnoPreferenciasRepository) {
    this.conversacionRepository = conversacionRepository;
    this.mensajeRepository = mensajeRepository;
    this.userAccountRepository = userAccountRepository;
    this.alumnoPreferenciasRepository = alumnoPreferenciasRepository;
  }

  @Transactional(readOnly = true)
  public List<ConversacionResponse> listConversaciones(JwtAuthenticationToken authentication) {
    UserAccount currentUser = currentUser(authentication);
    return conversacionRepository.findMineOrderByUpdatedAtDesc(currentUser.getId()).stream()
        .map(conversacion -> ConversacionResponse.from(
            conversacion,
            currentUser.getId(),
            mensajeRepository.findFirstByConversacionIdOrderByCreatedAtDescIdDesc(
                conversacion.getId()).orElse(null)))
        .toList();
  }

  @Transactional(readOnly = true)
  public List<ContactoMensajeResponse> buscarContactos(
      String nombre,
      JwtAuthenticationToken authentication) {
    UserAccount currentUser = currentUser(authentication);
    if (!canUseContactSearch(currentUser)) {
      return List.of();
    }

    String nameFilter = nombre == null ? "" : nombre.trim().toLowerCase();
    List<UserAccount> contactos = contactosDisponibles(currentUser);
    Map<Long, AlumnoPreferencias> preferenciasPorAlumno = preferenciasPorAlumno(contactos);

    return contactos.stream()
        .filter(contacto -> nameFilter.isEmpty()
            || contacto.getDisplayName().toLowerCase().contains(nameFilter))
        .sorted(Comparator.comparing(UserAccount::getDisplayName, String.CASE_INSENSITIVE_ORDER))
        .map(contacto -> {
          AlumnoPreferencias preferencias = preferenciasPorAlumno.get(contacto.getId());
          return new ContactoMensajeResponse(
              contacto.getId(),
              contacto.getDisplayName(),
              preferencias == null ? null : preferencias.getFamiliaProfesional(),
              preferencias == null ? null : preferencias.getCicloFormativo());
        })
        .toList();
  }

  @Transactional
  public ConversacionResponse crearConversacion(
      ConversacionCreateRequest request,
      JwtAuthenticationToken authentication) {
    UserAccount currentUser = currentUser(authentication);
    UserAccount contacto = userAccountRepository.findById(request.contactoId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contacto no encontrado"));
    requireCompatibleContact(currentUser, contacto);

    Conversacion conversacion = conversacionRepository
        .findBetweenUsers(currentUser.getId(), contacto.getId())
        .orElseGet(() -> conversacionRepository.save(new Conversacion(null, currentUser, contacto)));

    return ConversacionResponse.from(
        conversacion,
        currentUser.getId(),
        mensajeRepository.findFirstByConversacionIdOrderByCreatedAtDescIdDesc(
            conversacion.getId()).orElse(null));
  }

  @Transactional(readOnly = true)
  public List<MensajeResponse> listMensajes(
      Long conversacionId,
      JwtAuthenticationToken authentication) {
    UserAccount currentUser = currentUser(authentication);
    requireConversacion(conversacionId, currentUser.getId());
    return mensajeRepository.findByConversacionIdOrderByCreatedAtAsc(conversacionId).stream()
        .map(mensaje -> MensajeResponse.from(mensaje, currentUser.getId()))
        .toList();
  }

  @Transactional
  public MensajeResponse enviar(
      Long conversacionId,
      MensajeRequest request,
      JwtAuthenticationToken authentication) {
    UserAccount currentUser = currentUser(authentication);
    Conversacion conversacion = requireConversacion(conversacionId, currentUser.getId());
    Mensaje mensaje = mensajeRepository.save(new Mensaje(
        conversacion,
        currentUser,
        request.contenido()));
    conversacion.touch();
    return MensajeResponse.from(mensaje, currentUser.getId());
  }

  private Conversacion requireConversacion(Long conversacionId, Long currentUserId) {
    return conversacionRepository.findMineById(conversacionId, currentUserId)
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Conversacion no encontrada"));
  }

  private UserAccount currentUser(JwtAuthenticationToken authentication) {
    return userAccountRepository.findByEmailIgnoreCase(authentication.getName())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesion no valida"));
  }

  private void requireCompatibleContact(UserAccount currentUser, UserAccount contacto) {
    if (currentUser.getId().equals(contacto.getId())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No puedes iniciar un chat contigo mismo");
    }
    if (!canUseContactSearch(currentUser) || !isChatContact(contacto)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Contacto no disponible para mensajes");
    }

    if (hasProfesoradoRole(currentUser) && isChatContact(contacto)) {
      return;
    }
    if (currentUser.getRoles().contains(UserRole.ALUMNO) && hasProfesoradoRole(contacto)) {
      return;
    }
    requireSameProfessionalFamily(currentUser, contacto);
  }

  private List<UserAccount> contactosDisponibles(UserAccount currentUser) {
    Map<Long, UserAccount> contactos = new LinkedHashMap<>();

    if (currentUser.getRoles().contains(UserRole.ALUMNO)) {
      addAlumnadoCompatible(currentUser, contactos);
      addByRole(contactos, UserRole.TUTOR_CENTRO);
      addByRole(contactos, UserRole.COORDINADOR);
    } else if (hasProfesoradoRole(currentUser)) {
      addByRole(contactos, UserRole.ALUMNO);
      addByRole(contactos, UserRole.TUTOR_CENTRO);
      addByRole(contactos, UserRole.COORDINADOR);
    }

    contactos.remove(currentUser.getId());
    return List.copyOf(contactos.values());
  }

  private void addAlumnadoCompatible(UserAccount currentUser, Map<Long, UserAccount> contactos) {
    AlumnoPreferencias currentPreferences = alumnoPreferenciasRepository
        .findByAlumnoId(currentUser.getId())
        .orElse(null);
    if (currentPreferences == null || isBlank(currentPreferences.getFamiliaProfesional())) {
      return;
    }
    alumnoPreferenciasRepository.findCompatibleStudents(
            currentUser.getId(),
            currentPreferences.getFamiliaProfesional())
        .forEach(preferencias -> contactos.put(
            preferencias.getAlumno().getId(),
            preferencias.getAlumno()));
  }

  private void addByRole(Map<Long, UserAccount> contactos, UserRole role) {
    userAccountRepository.findAllByRole(role)
        .forEach(contacto -> contactos.put(contacto.getId(), contacto));
  }

  private Map<Long, AlumnoPreferencias> preferenciasPorAlumno(List<UserAccount> contactos) {
    List<Long> alumnoIds = contactos.stream()
        .filter(contacto -> contacto.getRoles().contains(UserRole.ALUMNO))
        .map(UserAccount::getId)
        .toList();
    if (alumnoIds.isEmpty()) {
      return Map.of();
    }

    Map<Long, AlumnoPreferencias> preferenciasPorAlumno = new LinkedHashMap<>();
    alumnoPreferenciasRepository.findByAlumnoIdIn(alumnoIds)
        .forEach(preferencias -> preferenciasPorAlumno.put(
            preferencias.getAlumno().getId(),
            preferencias));
    return preferenciasPorAlumno;
  }

  private void requireSameProfessionalFamily(UserAccount currentUser, UserAccount contacto) {
    if (!currentUser.getRoles().contains(UserRole.ALUMNO)
        || !contacto.getRoles().contains(UserRole.ALUMNO)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Contacto no disponible para mensajes");
    }

    AlumnoPreferencias currentPreferences = alumnoPreferenciasRepository
        .findByAlumnoId(currentUser.getId())
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "Completa tu familia profesional para iniciar chats"));
    AlumnoPreferencias contactPreferences = alumnoPreferenciasRepository
        .findByAlumnoId(contacto.getId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contacto no compatible"));

    if (isBlank(currentPreferences.getFamiliaProfesional())
        || isBlank(contactPreferences.getFamiliaProfesional())
        || !currentPreferences.getFamiliaProfesional()
            .equalsIgnoreCase(contactPreferences.getFamiliaProfesional())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Contacto fuera de tu grupo profesional");
    }
  }

  private boolean canUseContactSearch(UserAccount user) {
    return user.getRoles().contains(UserRole.ALUMNO) || hasProfesoradoRole(user);
  }

  private boolean isChatContact(UserAccount user) {
    return user.getRoles().contains(UserRole.ALUMNO) || hasProfesoradoRole(user);
  }

  private boolean hasProfesoradoRole(UserAccount user) {
    return user.getRoles().stream().anyMatch(ROLES_PROFESORADO::contains);
  }

  private boolean isBlank(String value) {
    return value == null || value.isBlank();
  }
}
