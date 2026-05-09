package com.fctnow.backend.ofertas.externas;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record AdzunaSearchResponse(Long count, List<AdzunaJob> results) {

  public AdzunaSearchResponse {
    results = results == null ? List.of() : results;
  }
}
