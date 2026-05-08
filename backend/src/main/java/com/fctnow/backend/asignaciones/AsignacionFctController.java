package com.fctnow.backend.asignaciones;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/asignaciones")
@Tag(name = "Asignaciones FCT", description = "Asignaciones FCT generadas a partir de solicitudes aceptadas")
public class AsignacionFctController {

  private final AsignacionFctService asignacionFctService;

  public AsignacionFctController(AsignacionFctService asignacionFctService) {
    this.asignacionFctService = asignacionFctService;
  }

  @GetMapping
  @Operation(summary = "List assignments for centre staff")
  @SecurityRequirement(name = "bearerAuth")
  public List<AsignacionFctResponse> list(JwtAuthenticationToken authentication) {
    return asignacionFctService.findAll(authentication);
  }

  @GetMapping("/candidatas")
  @Operation(summary = "List accepted applications still pending an assignment")
  @SecurityRequirement(name = "bearerAuth")
  public List<AsignacionCandidataResponse> candidatas(JwtAuthenticationToken authentication) {
    return asignacionFctService.findCandidatas(authentication);
  }

  @PostMapping
  @Operation(summary = "Create an assignment from an accepted application")
  @SecurityRequirement(name = "bearerAuth")
  public ResponseEntity<AsignacionFctResponse> create(
      @Valid @RequestBody AsignacionCreateRequest request,
      JwtAuthenticationToken authentication) {
    AsignacionFctResponse asignacion = asignacionFctService.create(request, authentication);
    return ResponseEntity
        .created(URI.create("/api/asignaciones/" + asignacion.id()))
        .body(asignacion);
  }
}
