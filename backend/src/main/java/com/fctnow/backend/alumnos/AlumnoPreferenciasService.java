package com.fctnow.backend.alumnos;

import com.fctnow.backend.user.UserAccount;
import com.fctnow.backend.user.UserAccountRepository;
import com.fctnow.backend.user.UserRole;
import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AlumnoPreferenciasService {

  private static final long MAX_CV_SIZE_BYTES = 2 * 1024 * 1024;

  private final AlumnoPreferenciasRepository alumnoPreferenciasRepository;
  private final UserAccountRepository userAccountRepository;

  public AlumnoPreferenciasService(
      AlumnoPreferenciasRepository alumnoPreferenciasRepository,
      UserAccountRepository userAccountRepository) {
    this.alumnoPreferenciasRepository = alumnoPreferenciasRepository;
    this.userAccountRepository = userAccountRepository;
  }

  @Transactional(readOnly = true)
  public AlumnoPreferenciasResponse findMine(JwtAuthenticationToken authentication) {
    UserAccount alumno = currentAlumno(authentication);
    return alumnoPreferenciasRepository.findByAlumnoId(alumno.getId())
        .map(AlumnoPreferenciasResponse::from)
        .orElseGet(AlumnoPreferenciasResponse::empty);
  }

  @Transactional
  public AlumnoPreferenciasResponse updateMine(
      AlumnoPreferenciasRequest request,
      JwtAuthenticationToken authentication) {
    AlumnoPreferencias preferencias = findOrCreate(currentAlumno(authentication));
    preferencias.update(
        optional(request.familiaProfesional()),
        optional(request.cicloFormativo()),
        optional(request.localidadPreferida()),
        request.modalidadPreferida(),
        request.fechaDisponibilidad(),
        optional(request.observaciones()));
    return AlumnoPreferenciasResponse.from(alumnoPreferenciasRepository.save(preferencias));
  }

  @Transactional
  public AlumnoPreferenciasResponse uploadCv(
      MultipartFile file,
      JwtAuthenticationToken authentication) {
    validateCv(file);
    AlumnoPreferencias preferencias = findOrCreate(currentAlumno(authentication));

    try {
      preferencias.updateCv(file.getOriginalFilename(), file.getContentType(), file.getBytes());
    } catch (IOException exception) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se pudo leer el CV");
    }

    return AlumnoPreferenciasResponse.from(alumnoPreferenciasRepository.save(preferencias));
  }

  @Transactional(readOnly = true)
  public AlumnoCvResource findCv(JwtAuthenticationToken authentication) {
    UserAccount alumno = currentAlumno(authentication);
    AlumnoPreferencias preferencias = alumnoPreferenciasRepository.findByAlumnoId(alumno.getId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CV no encontrado"));

    if (preferencias.getCvContent() == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "CV no encontrado");
    }

    return new AlumnoCvResource(
        preferencias.getCvFileName(),
        preferencias.getCvContentType(),
        preferencias.getCvContent());
  }

  private AlumnoPreferencias findOrCreate(UserAccount alumno) {
    return alumnoPreferenciasRepository.findByAlumnoId(alumno.getId())
        .orElseGet(() -> new AlumnoPreferencias(alumno));
  }

  private UserAccount currentAlumno(JwtAuthenticationToken authentication) {
    UserAccount userAccount = userAccountRepository.findByEmailIgnoreCase(authentication.getName())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesion no valida"));

    if (!userAccount.getRoles().contains(UserRole.ALUMNO)) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          "Solo los alumnos pueden gestionar sus preferencias");
    }

    return userAccount;
  }

  private void validateCv(MultipartFile file) {
    if (file.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El CV no puede estar vacio");
    }

    if (file.getSize() > MAX_CV_SIZE_BYTES) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El CV no puede superar 2 MB");
    }

    String contentType = file.getContentType();
    String filename = file.getOriginalFilename();
    if (!"application/pdf".equalsIgnoreCase(contentType)
        || filename == null
        || !filename.toLowerCase().endsWith(".pdf")) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El CV debe ser un PDF");
    }
  }

  private String optional(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    return value.trim();
  }
}
