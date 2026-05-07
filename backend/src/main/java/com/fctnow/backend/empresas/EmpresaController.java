package com.fctnow.backend.empresas;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/empresas")
@Tag(name = "Empresas", description = "Basic management of FCT partner companies")
public class EmpresaController {

  private final EmpresaService empresaService;

  public EmpresaController(EmpresaService empresaService) {
    this.empresaService = empresaService;
  }

  @GetMapping
  @Operation(summary = "List partner companies")
  @SecurityRequirement(name = "bearerAuth")
  public List<EmpresaResponse> list() {
    return empresaService.findAll();
  }

  @GetMapping("/me")
  @Operation(summary = "Get the authenticated company profile")
  @SecurityRequirement(name = "bearerAuth")
  public EmpresaResponse mine(JwtAuthenticationToken authentication) {
    return empresaService.findMine(authentication);
  }

  @PutMapping("/me")
  @Operation(summary = "Update the authenticated company profile")
  @SecurityRequirement(name = "bearerAuth")
  public EmpresaResponse updateMine(
      @Valid @RequestBody EmpresaPerfilRequest request,
      JwtAuthenticationToken authentication) {
    return empresaService.updateMine(request, authentication);
  }

  @GetMapping("/{id}")
  @Operation(summary = "Get a partner company")
  @SecurityRequirement(name = "bearerAuth")
  public EmpresaResponse detail(@PathVariable Long id) {
    return empresaService.findById(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Create a partner company")
  @SecurityRequirement(name = "bearerAuth")
  public EmpresaResponse create(@Valid @RequestBody EmpresaRequest request) {
    return empresaService.create(request);
  }

  @PutMapping("/{id}")
  @Operation(summary = "Update a partner company")
  @SecurityRequirement(name = "bearerAuth")
  public EmpresaResponse update(@PathVariable Long id, @Valid @RequestBody EmpresaRequest request) {
    return empresaService.update(id, request);
  }
}
