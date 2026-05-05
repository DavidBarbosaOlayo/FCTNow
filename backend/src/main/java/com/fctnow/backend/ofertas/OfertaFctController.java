package com.fctnow.backend.ofertas;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ofertas")
@Tag(name = "Ofertas FCT", description = "Read-only catalog of published FCT offers")
public class OfertaFctController {

  private final OfertaFctService ofertaFctService;

  public OfertaFctController(OfertaFctService ofertaFctService) {
    this.ofertaFctService = ofertaFctService;
  }

  @GetMapping
  @Operation(summary = "List published FCT offers")
  @SecurityRequirement(name = "bearerAuth")
  public List<OfertaFctResponse> list(
      @RequestParam(required = false) String q,
      @RequestParam(required = false) String familiaProfesional,
      @RequestParam(required = false) String localidad,
      @RequestParam(required = false) OfertaModalidad modalidad) {
    return ofertaFctService.findPublishedOffers(new OfertaFctFilters(
        q,
        familiaProfesional,
        localidad,
        modalidad));
  }

  @GetMapping("/{id}")
  @Operation(summary = "Get a published FCT offer")
  @SecurityRequirement(name = "bearerAuth")
  public OfertaFctResponse detail(@PathVariable Long id) {
    return ofertaFctService.findPublishedOffer(id);
  }
}
