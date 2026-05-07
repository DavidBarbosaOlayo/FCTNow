package com.fctnow.backend.ofertas;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/empresas/me/ofertas")
@Tag(name = "Ofertas FCT (empresa)", description = "Gestion de ofertas FCT propias de la empresa autenticada")
public class EmpresaOfertaController {

  private final EmpresaOfertaService empresaOfertaService;

  public EmpresaOfertaController(EmpresaOfertaService empresaOfertaService) {
    this.empresaOfertaService = empresaOfertaService;
  }

  @GetMapping
  @Operation(summary = "List the authenticated company offers")
  @SecurityRequirement(name = "bearerAuth")
  public List<OfertaFctResponse> mine(JwtAuthenticationToken authentication) {
    return empresaOfertaService.findMine(authentication);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Create an offer for the authenticated company")
  @SecurityRequirement(name = "bearerAuth")
  public OfertaFctResponse create(
      @Valid @RequestBody OfertaFctRequest request,
      JwtAuthenticationToken authentication) {
    return empresaOfertaService.create(request, authentication);
  }

  @PutMapping("/{id}")
  @Operation(summary = "Update a draft offer owned by the authenticated company")
  @SecurityRequirement(name = "bearerAuth")
  public OfertaFctResponse update(
      @PathVariable Long id,
      @Valid @RequestBody OfertaFctRequest request,
      JwtAuthenticationToken authentication) {
    return empresaOfertaService.update(id, request, authentication);
  }

  @PatchMapping("/{id}/estado")
  @Operation(summary = "Change the state of an offer owned by the authenticated company")
  @SecurityRequirement(name = "bearerAuth")
  public OfertaFctResponse changeEstado(
      @PathVariable Long id,
      @Valid @RequestBody OfertaEstadoChangeRequest request,
      JwtAuthenticationToken authentication) {
    return empresaOfertaService.changeEstado(id, request, authentication);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Operation(summary = "Delete a draft offer owned by the authenticated company")
  @SecurityRequirement(name = "bearerAuth")
  public void delete(@PathVariable Long id, JwtAuthenticationToken authentication) {
    empresaOfertaService.delete(id, authentication);
  }
}
