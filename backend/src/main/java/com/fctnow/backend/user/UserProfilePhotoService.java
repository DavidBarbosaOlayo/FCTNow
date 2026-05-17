package com.fctnow.backend.user;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserProfilePhotoService {

  private static final long MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

  private final UserAccountRepository userAccountRepository;

  public UserProfilePhotoService(UserAccountRepository userAccountRepository) {
    this.userAccountRepository = userAccountRepository;
  }

  @Transactional(readOnly = true)
  public UserProfilePhotoResponse findMine(JwtAuthenticationToken authentication) {
    UserAccount user = currentUser(authentication);
    return UserProfilePhotoResponse.from(user);
  }

  @Transactional
  public UserProfilePhotoResponse uploadPhoto(
      MultipartFile file,
      JwtAuthenticationToken authentication) {
    UserAccount user = currentUser(authentication);
    if (!canEditPhoto(user)) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          "Tu rol gestiona la foto desde otra pantalla.");
    }

    byte[] content = readFile(file);
    String contentType = validatePhoto(file, content);

    user.updateFoto(file.getOriginalFilename(), contentType, content);
    return UserProfilePhotoResponse.from(userAccountRepository.save(user));
  }

  private boolean canEditPhoto(UserAccount user) {
    return user.getRoles().contains(UserRole.TUTOR_CENTRO)
        || user.getRoles().contains(UserRole.COORDINADOR);
  }

  private UserAccount currentUser(JwtAuthenticationToken authentication) {
    return userAccountRepository.findByEmailIgnoreCase(authentication.getName())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesion no valida"));
  }

  private byte[] readFile(MultipartFile file) {
    try {
      return file.getBytes();
    } catch (IOException exception) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se pudo leer la foto");
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
    if (hasJpegSignature(content)) return "image/jpeg";
    if (hasPngSignature(content)) return "image/png";
    if (hasWebpSignature(content)) return "image/webp";

    String contentType = file.getContentType();
    if (contentType != null) {
      String normalized = contentType.toLowerCase(Locale.ROOT);
      if ("image/jpeg".equals(normalized)
          || "image/png".equals(normalized)
          || "image/webp".equals(normalized)) {
        return normalized;
      }
    }

    String filename = normalizedFilename(file);
    if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
    if (filename.endsWith(".png")) return "image/png";
    if (filename.endsWith(".webp")) return "image/webp";
    return null;
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
}
