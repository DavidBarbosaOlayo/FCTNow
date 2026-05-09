package com.fctnow.backend.asignaciones.externas;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/asignaciones/externas")
@Tag(name = "Asignaciones FCT externas", description = "Asignaciones FCT del centro originadas en ofertas externas")
public class AsignacionFctExternaController {

  private final AsignacionFctExternaService service;

  public AsignacionFctExternaController(AsignacionFctExternaService service) {
    this.service = service;
  }

  @GetMapping
  @Operation(summary = "Listar asignaciones FCT externas existentes")
  @SecurityRequirement(name = "bearerAuth")
  public List<AsignacionFctExternaResponse> list(JwtAuthenticationToken authentication) {
    return service.findAll(authentication);
  }

  @GetMapping("/candidatas")
  @Operation(summary = "Listar solicitudes externas aceptadas pendientes de asignar")
  @SecurityRequirement(name = "bearerAuth")
  public List<AsignacionExternaCandidataResponse> candidatas(JwtAuthenticationToken authentication) {
    return service.findCandidatas(authentication);
  }

  @PostMapping
  @Operation(summary = "Crear una asignacion FCT a partir de una solicitud externa aceptada")
  @SecurityRequirement(name = "bearerAuth")
  public ResponseEntity<AsignacionFctExternaResponse> create(
      @Valid @RequestBody AsignacionExternaCreateRequest request,
      JwtAuthenticationToken authentication) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, authentication));
  }
}
