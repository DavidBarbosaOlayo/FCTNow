package com.fctnow.backend.ofertas.externas;

import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AdzunaService {

  private static final int MAX_RESULTS_PER_PAGE = 50;
  private static final int MIN_RESULTS_PER_PAGE = 1;
  private static final int DEFAULT_RESULTS_PER_PAGE = 20;
  private static final int MIN_PAGE = 1;
  private static final String ATTRIBUTION = "Resultados ofrecidos por Adzuna";
  private static final String ATTRIBUTION_URL_TEMPLATE = "https://www.adzuna.%s/";

  private final AdzunaClient adzunaClient;
  private final AdzunaProperties properties;

  public AdzunaService(AdzunaClient adzunaClient, AdzunaProperties properties) {
    this.adzunaClient = adzunaClient;
    this.properties = properties;
  }

  public OfertaExternaPageResponse search(
      String q,
      String where,
      String category,
      Integer page,
      Integer resultsPerPage) {
    int safePage = Math.max(page == null ? MIN_PAGE : page, MIN_PAGE);
    int safeSize = clampResultsPerPage(resultsPerPage);
    String whatOr = String.join(" ", properties.defaultKeywords());

    AdzunaSearchResponse response = adzunaClient.search(q, whatOr, where, category, safePage, safeSize);

    List<OfertaExternaResponse> mapped = response.results().stream()
        .map(this::toResponse)
        .toList();

    return new OfertaExternaPageResponse(
        mapped,
        safePage,
        safeSize,
        response.count() == null ? mapped.size() : response.count(),
        ATTRIBUTION,
        attributionUrl());
  }

  private int clampResultsPerPage(Integer requested) {
    if (requested == null) {
      return DEFAULT_RESULTS_PER_PAGE;
    }
    if (requested < MIN_RESULTS_PER_PAGE) {
      return MIN_RESULTS_PER_PAGE;
    }
    if (requested > MAX_RESULTS_PER_PAGE) {
      return MAX_RESULTS_PER_PAGE;
    }
    return requested;
  }

  private OfertaExternaResponse toResponse(AdzunaJob job) {
    return new OfertaExternaResponse(
        job.id(),
        "ADZUNA",
        job.title(),
        job.company() != null ? job.company().displayName() : null,
        localidadFor(job),
        regionFor(job),
        job.description(),
        job.category() != null ? job.category().label() : null,
        job.contractType(),
        job.contractTime(),
        job.salaryMin(),
        job.salaryMax(),
        toBoolean(job.salaryIsPredicted()),
        toInstant(job.created()),
        job.redirectUrl());
  }

  private String localidadFor(AdzunaJob job) {
    AdzunaJob.AdzunaLocation location = job.location();
    if (location == null) {
      return null;
    }
    if (location.area() != null && !location.area().isEmpty()) {
      return location.area().get(location.area().size() - 1);
    }
    return location.displayName();
  }

  private String regionFor(AdzunaJob job) {
    AdzunaJob.AdzunaLocation location = job.location();
    if (location == null || location.area() == null || location.area().size() < 2) {
      return null;
    }
    return location.area().get(1);
  }

  private java.time.Instant toInstant(OffsetDateTime created) {
    return created == null ? null : created.toInstant();
  }

  private Boolean toBoolean(String value) {
    if (value == null) {
      return null;
    }
    return "1".equals(value) || "true".equalsIgnoreCase(value);
  }

  private String attributionUrl() {
    return String.format(ATTRIBUTION_URL_TEMPLATE, properties.country());
  }
}
