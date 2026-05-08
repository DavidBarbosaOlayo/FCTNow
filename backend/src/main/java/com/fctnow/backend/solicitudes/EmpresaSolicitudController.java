package com.fctnow.backend.solicitudes;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/empresas/me/solicitudes")
@Tag(name = "Solicitudes FCT (empresa)", description = "Gestion de solicitudes recibidas por la empresa autenticada")
public class EmpresaSolicitudController {

  private final EmpresaSolicitudService empresaSolicitudService;

  public EmpresaSolicitudController(EmpresaSolicitudService empresaSolicitudService) {
    this.empresaSolicitudService = empresaSolicitudService;
  }

  @GetMapping
  @Operation(summary = "List the applications received on the authenticated company offers")
  @SecurityRequirement(name = "bearerAuth")
  public List<EmpresaSolicitudResponse> mine(JwtAuthenticationToken authentication) {
    return empresaSolicitudService.findMine(authentication);
  }

  @PatchMapping("/{id}/estado")
  @Operation(summary = "Accept or reject an application received by the authenticated company")
  @SecurityRequirement(name = "bearerAuth")
  public EmpresaSolicitudResponse changeEstado(
      @PathVariable Long id,
      @Valid @RequestBody SolicitudEstadoChangeRequest request,
      JwtAuthenticationToken authentication) {
    return empresaSolicitudService.changeEstado(id, request, authentication);
  }
}
