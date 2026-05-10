package com.fctnow.backend.tutor;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
