package com.fctnow.backend.ofertas.externas;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriBuilder;

@Component
public class AdzunaClient {

  private static final Logger log = LoggerFactory.getLogger(AdzunaClient.class);

  private final RestClient restClient;
  private final AdzunaProperties properties;
  private final ObjectMapper objectMapper;

  public AdzunaClient(
      RestClient adzunaRestClient,
      AdzunaProperties properties,
      ObjectMapper objectMapper) {
    this.restClient = adzunaRestClient;
    this.properties = properties;
    this.objectMapper = objectMapper;
  }

  public AdzunaSearchResponse search(
      String what,
      String whatOr,
      String where,
      String category,
      int page,
      int resultsPerPage) {
    if (!properties.isConfigured()) {
      throw new AdzunaUnavailableException("Adzuna API credentials are not configured");
    }

    try {
      String rawBody = restClient.get()
          .uri(uri -> buildUri(uri, what, whatOr, where, category, page, resultsPerPage))
          .retrieve()
          .onStatus(HttpStatusCode::isError, (request, response) -> {
            throw new AdzunaUnavailableException(
                "Adzuna responded with HTTP " + response.getStatusCode().value());
          })
          .body(String.class);

      if (rawBody == null || rawBody.isBlank()) {
        return new AdzunaSearchResponse(0L, java.util.List.of());
      }

      return objectMapper.readValue(rawBody, AdzunaSearchResponse.class);
    } catch (ResourceAccessException ex) {
      log.warn("Adzuna request failed: {}", ex.getMessage());
      throw new AdzunaUnavailableException("Adzuna is not reachable", ex);
    } catch (AdzunaUnavailableException ex) {
      throw ex;
    } catch (JsonProcessingException ex) {
      log.warn("Failed to parse Adzuna response: {}", ex.getMessage());
      throw new AdzunaUnavailableException("Adzuna returned a malformed response", ex);
    } catch (RuntimeException ex) {
      log.warn("Unexpected error calling Adzuna: {}", ex.toString());
      throw new AdzunaUnavailableException("Unexpected error calling Adzuna", ex);
    }
  }

  private java.net.URI buildUri(
      UriBuilder uri,
      String what,
      String whatOr,
      String where,
      String category,
      int page,
      int resultsPerPage) {
    UriBuilder builder = uri
        .path("/{country}/search/{page}")
        .queryParam("app_id", properties.appId())
        .queryParam("app_key", properties.appKey())
        .queryParam("results_per_page", resultsPerPage)
        .queryParam("content-type", "application/json");

    if (hasText(what)) {
      builder.queryParam("what", what);
    }
    if (hasText(whatOr)) {
      builder.queryParam("what_or", whatOr);
    }
    if (hasText(where)) {
      builder.queryParam("where", where);
    }
    if (hasText(category)) {
      builder.queryParam("category", category);
    }

    return builder.build(properties.country(), page);
  }

  private boolean hasText(String value) {
    return value != null && !value.isBlank();
  }
}
