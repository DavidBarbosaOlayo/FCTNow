package com.fctnow.backend.alumnos;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/alumnos/me")
@Tag(name = "Preferencias alumno", description = "Preferencias y CV del alumno autenticado")
public class AlumnoPreferenciasController {

  private final AlumnoPreferenciasService alumnoPreferenciasService;

  public AlumnoPreferenciasController(AlumnoPreferenciasService alumnoPreferenciasService) {
    this.alumnoPreferenciasService = alumnoPreferenciasService;
  }

  @GetMapping("/preferencias")
  @Operation(summary = "Get the authenticated student's preferences")
  @SecurityRequirement(name = "bearerAuth")
  public AlumnoPreferenciasResponse mine(JwtAuthenticationToken authentication) {
    return alumnoPreferenciasService.findMine(authentication);
  }

  @PutMapping("/preferencias")
  @Operation(summary = "Update the authenticated student's preferences")
  @SecurityRequirement(name = "bearerAuth")
  public AlumnoPreferenciasResponse update(
      @Valid @RequestBody AlumnoPreferenciasRequest request,
      JwtAuthenticationToken authentication) {
    return alumnoPreferenciasService.updateMine(request, authentication);
  }

  @PutMapping(value = "/cv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @Operation(summary = "Upload or replace the authenticated student's CV")
  @SecurityRequirement(name = "bearerAuth")
  public AlumnoPreferenciasResponse uploadCv(
      @RequestPart("file") MultipartFile file,
      JwtAuthenticationToken authentication) {
    return alumnoPreferenciasService.uploadCv(file, authentication);
  }

  @PutMapping(value = "/foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @Operation(summary = "Upload or replace the authenticated student's profile photo")
  @SecurityRequirement(name = "bearerAuth")
  public AlumnoPreferenciasResponse uploadPhoto(
      @RequestPart("file") MultipartFile file,
      JwtAuthenticationToken authentication) {
    return alumnoPreferenciasService.uploadPhoto(file, authentication);
  }

  @GetMapping("/cv")
  @Operation(summary = "Download the authenticated student's CV")
  @SecurityRequirement(name = "bearerAuth")
  public ResponseEntity<byte[]> cv(JwtAuthenticationToken authentication) {
    AlumnoCvResource cv = alumnoPreferenciasService.findCv(authentication);

    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType(cv.contentType()))
        .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
            .filename(cv.fileName())
            .build()
            .toString())
        .body(cv.content());
  }
}
