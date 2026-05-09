package com.fctnow.backend.ofertas.externas;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/ofertas/externas")
@Tag(name = "Ofertas externas", description = "Ofertas reales obtenidas vía API de Adzuna")
public class OfertaExternaController {

  private final AdzunaService adzunaService;

  public OfertaExternaController(AdzunaService adzunaService) {
    this.adzunaService = adzunaService;
  }

  @GetMapping
  @Operation(summary = "List external internship offers from Adzuna")
  public OfertaExternaPageResponse list(
      @RequestParam(required = false) String q,
      @RequestParam(required = false) String where,
      @RequestParam(required = false) String category,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer resultsPerPage) {
    try {
      return adzunaService.search(q, where, category, page, resultsPerPage);
    } catch (AdzunaUnavailableException ex) {
      throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage(), ex);
    }
  }
}
