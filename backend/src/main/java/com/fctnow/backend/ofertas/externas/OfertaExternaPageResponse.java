package com.fctnow.backend.ofertas.externas;

import java.util.List;

public record OfertaExternaPageResponse(
    List<OfertaExternaResponse> results,
    int page,
    int resultsPerPage,
    long totalResults,
    String attribution,
    String attributionUrl) {

  public OfertaExternaPageResponse {
    results = results == null ? List.of() : List.copyOf(results);
  }
}
