package com.fctnow.backend.tutor;

import com.fctnow.backend.alumnos.AlumnoCvResource;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/tutor")
@Tag(name = "Tutor centro", description = "Vistas agregadas para el rol tutor centro")
public class TutorAlumnoController {

  private final TutorAlumnoService tutorAlumnoService;

  public TutorAlumnoController(TutorAlumnoService tutorAlumnoService) {
    this.tutorAlumnoService = tutorAlumnoService;
  }

  @GetMapping("/alumnos")
  @Operation(summary = "List students with aggregated FCT status for centre staff")
  @SecurityRequirement(name = "bearerAuth")
  public List<TutorAlumnoResponse> listAlumnos(JwtAuthenticationToken authentication) {
    return tutorAlumnoService.findAlumnos(authentication);
  }

  @PostMapping("/alumnos")
  @Operation(summary = "Create a student account from the tutor panel")
  @SecurityRequirement(name = "bearerAuth")
  public ResponseEntity<TutorAlumnoResponse> createAlumno(
      @Valid @RequestBody TutorAlumnoCreateRequest request,
      JwtAuthenticationToken authentication) {
    TutorAlumnoResponse alumno = tutorAlumnoService.createAlumno(request, authentication);

    return ResponseEntity.created(URI.create("/api/tutor/alumnos/" + alumno.id()))
        .body(alumno);
  }

  @GetMapping("/alumnos/import-template")
  @Operation(summary = "Download the Excel template for bulk student creation")
  @SecurityRequirement(name = "bearerAuth")
  public ResponseEntity<byte[]> importTemplate(JwtAuthenticationToken authentication) {
    byte[] template = tutorAlumnoService.createImportTemplate(authentication);

    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
        .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
            .filename("plantilla-alumnos-fctnow.xlsx")
            .build()
            .toString())
        .body(template);
  }

  @PostMapping(value = "/alumnos/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @Operation(summary = "Import student accounts from an Excel file")
  @SecurityRequirement(name = "bearerAuth")
  public TutorAlumnoImportResultResponse importAlumnos(
      @RequestPart("file") MultipartFile file,
      JwtAuthenticationToken authentication) {
    return tutorAlumnoService.importAlumnos(file, authentication);
  }

  @GetMapping("/alumnos/{alumnoId}/cv")
  @Operation(summary = "Download a student's CV for centre staff")
  @SecurityRequirement(name = "bearerAuth")
  public ResponseEntity<byte[]> alumnoCv(
      @PathVariable Long alumnoId,
      JwtAuthenticationToken authentication) {
    AlumnoCvResource cv = tutorAlumnoService.findAlumnoCv(alumnoId, authentication);

    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType(cv.contentType()))
        .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
            .filename(cv.fileName())
            .build()
            .toString())
        .body(cv.content());
  }
}
