package com.fctnow.backend.solicitudes;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Tag(name = "Solicitudes FCT", description = "Basic FCT offer applications")
public class SolicitudFctController {

  private final SolicitudFctService solicitudFctService;

  public SolicitudFctController(SolicitudFctService solicitudFctService) {
    this.solicitudFctService = solicitudFctService;
  }

  @GetMapping("/solicitudes/me")
  @Operation(summary = "List the authenticated student's FCT applications")
  @SecurityRequirement(name = "bearerAuth")
  public List<SolicitudFctResponse> mine(JwtAuthenticationToken authentication) {
    return solicitudFctService.findMine(authentication);
  }

  @PostMapping("/ofertas/{ofertaId}/solicitudes")
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Apply to a published FCT offer")
  @SecurityRequirement(name = "bearerAuth")
  public SolicitudFctResponse requestOffer(
      @PathVariable Long ofertaId,
      JwtAuthenticationToken authentication) {
    return solicitudFctService.requestOffer(ofertaId, authentication);
  }
}
