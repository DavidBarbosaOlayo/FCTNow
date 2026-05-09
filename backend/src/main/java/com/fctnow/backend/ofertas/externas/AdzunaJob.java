package com.fctnow.backend.ofertas.externas;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import java.time.OffsetDateTime;

@JsonIgnoreProperties(ignoreUnknown = true)
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record AdzunaJob(
    String id,
    String title,
    String description,
    String redirectUrl,
    OffsetDateTime created,
    AdzunaCompany company,
    AdzunaLocation location,
    AdzunaCategory category,
    Double salaryMin,
    Double salaryMax,
    String salaryIsPredicted,
    String contractType,
    String contractTime) {

  @JsonIgnoreProperties(ignoreUnknown = true)
  @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
  public record AdzunaCompany(String displayName) {}

  @JsonIgnoreProperties(ignoreUnknown = true)
  @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
  public record AdzunaLocation(String displayName, java.util.List<String> area) {}

  @JsonIgnoreProperties(ignoreUnknown = true)
  @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
  public record AdzunaCategory(String tag, String label) {}
}
