package com.fctnow.backend.alumnos;

import com.fctnow.backend.user.UserAccount;
import com.fctnow.backend.user.UserAccountRepository;
import com.fctnow.backend.user.UserRole;
import java.nio.charset.StandardCharsets;
import java.io.IOException;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AlumnoPreferenciasService {

  private static final long MAX_CV_SIZE_BYTES = 10 * 1024 * 1024;
  private static final long MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

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
    byte[] content = readFile(file, "No se pudo leer el CV");
    validateCv(file, content);
    AlumnoPreferencias preferencias = findOrCreate(currentAlumno(authentication));

    preferencias.updateCv(file.getOriginalFilename(), "application/pdf", content);

    return AlumnoPreferenciasResponse.from(alumnoPreferenciasRepository.save(preferencias));
  }

  @Transactional
  public AlumnoPreferenciasResponse uploadPhoto(
      MultipartFile file,
      JwtAuthenticationToken authentication) {
    byte[] content = readFile(file, "No se pudo leer la foto");
    String contentType = validatePhoto(file, content);
    AlumnoPreferencias preferencias = findOrCreate(currentAlumno(authentication));

    preferencias.updatePhoto(file.getOriginalFilename(), contentType, content);

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

  private byte[] readFile(MultipartFile file, String errorMessage) {
    try {
      return file.getBytes();
    } catch (IOException exception) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMessage);
    }
  }

  private void validateCv(MultipartFile file, byte[] content) {
    if (file.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El CV no puede estar vacio");
    }

    if (file.getSize() > MAX_CV_SIZE_BYTES) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El CV no puede superar 10 MB");
    }

    String filename = normalizedFilename(file);
    if (!filename.endsWith(".pdf") || !hasPdfSignature(content)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El CV debe ser un PDF");
    }
  }

  private String validatePhoto(MultipartFile file, byte[] content) {
    if (file.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La foto no puede estar vacia");
    }

    if (file.getSize() > MAX_PHOTO_SIZE_BYTES) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La foto no puede superar 5 MB");
    }

    String contentType = detectPhotoContentType(file, content);
    if (contentType == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La foto debe ser JPG, PNG o WebP");
    }
    return contentType;
  }

  private String detectPhotoContentType(MultipartFile file, byte[] content) {
    if (hasJpegSignature(content)) {
      return "image/jpeg";
    }
    if (hasPngSignature(content)) {
      return "image/png";
    }
    if (hasWebpSignature(content)) {
      return "image/webp";
    }

    String contentType = file.getContentType();
    if (contentType != null) {
      String normalizedContentType = contentType.toLowerCase(Locale.ROOT);
      if ("image/jpeg".equals(normalizedContentType)
          || "image/png".equals(normalizedContentType)
          || "image/webp".equals(normalizedContentType)) {
        return normalizedContentType;
      }
    }

    String filename = normalizedFilename(file);
    if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
      return "image/jpeg";
    }
    if (filename.endsWith(".png")) {
      return "image/png";
    }
    if (filename.endsWith(".webp")) {
      return "image/webp";
    }

    return null;
  }

  private boolean hasPdfSignature(byte[] content) {
    return content.length >= 4 && "%PDF".equals(new String(content, 0, 4, StandardCharsets.US_ASCII));
  }

  private boolean hasJpegSignature(byte[] content) {
    return content.length >= 3
        && (content[0] & 0xff) == 0xff
        && (content[1] & 0xff) == 0xd8
        && (content[2] & 0xff) == 0xff;
  }

  private boolean hasPngSignature(byte[] content) {
    return content.length >= 8
        && (content[0] & 0xff) == 0x89
        && content[1] == 0x50
        && content[2] == 0x4e
        && content[3] == 0x47
        && content[4] == 0x0d
        && content[5] == 0x0a
        && content[6] == 0x1a
        && content[7] == 0x0a;
  }

  private boolean hasWebpSignature(byte[] content) {
    return content.length >= 12
        && "RIFF".equals(new String(content, 0, 4, StandardCharsets.US_ASCII))
        && "WEBP".equals(new String(content, 8, 4, StandardCharsets.US_ASCII));
  }

  private String normalizedFilename(MultipartFile file) {
    String filename = file.getOriginalFilename();
    return filename == null ? "" : filename.toLowerCase(Locale.ROOT);
  }

  private String optional(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    return value.trim();
  }
}
