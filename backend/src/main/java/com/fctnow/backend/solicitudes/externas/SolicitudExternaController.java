package com.fctnow.backend.solicitudes.externas;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/alumno/solicitudes-externas")
@Tag(name = "Solicitudes externas", description = "Solicitudes manuales del alumno sobre ofertas externas (Adzuna)")
public class SolicitudExternaController {

  private final SolicitudExternaService service;

  public SolicitudExternaController(SolicitudExternaService service) {
    this.service = service;
  }

  @PostMapping
  @Operation(summary = "Marcar una oferta externa como solicitada")
  @SecurityRequirement(name = "bearerAuth")
  public ResponseEntity<SolicitudExternaResponse> create(
      @Valid @RequestBody SolicitudExternaCreateRequest request,
      JwtAuthenticationToken authentication) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, authentication));
  }

  @GetMapping
  @Operation(summary = "Listar mis solicitudes externas")
  @SecurityRequirement(name = "bearerAuth")
  public List<SolicitudExternaResponse> mine(JwtAuthenticationToken authentication) {
    return service.findMine(authentication);
  }

  @PatchMapping("/{id}/estado")
  @Operation(summary = "Actualizar el estado de una solicitud externa propia")
  @SecurityRequirement(name = "bearerAuth")
  public SolicitudExternaResponse changeEstado(
      @PathVariable Long id,
      @Valid @RequestBody SolicitudExternaEstadoChangeRequest request,
      JwtAuthenticationToken authentication) {
    return service.changeEstado(id, request, authentication);
  }

  @DeleteMapping("/{id}")
  @Operation(summary = "Eliminar una solicitud externa retirada propia")
  @SecurityRequirement(name = "bearerAuth")
  public ResponseEntity<Void> delete(
      @PathVariable Long id,
      JwtAuthenticationToken authentication) {
    service.delete(id, authentication);
    return ResponseEntity.noContent().build();
  }
}
