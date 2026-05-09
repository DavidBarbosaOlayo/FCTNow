package com.fctnow.backend.ofertas.externas;

import java.time.Duration;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

@ConfigurationProperties(prefix = "fctnow.adzuna")
public record AdzunaProperties(
    String baseUrl,
    String country,
    String appId,
    String appKey,
    List<String> defaultKeywords,
    Duration timeout) {

  public AdzunaProperties {
    baseUrl = StringUtils.hasText(baseUrl) ? baseUrl : "https://api.adzuna.com/v1/api/jobs";
    country = StringUtils.hasText(country) ? country : "es";
    defaultKeywords = (defaultKeywords == null || defaultKeywords.isEmpty())
        ? List.of("prácticas", "becario", "internship", "pasantía")
        : List.copyOf(defaultKeywords);
    timeout = timeout != null ? timeout : Duration.ofSeconds(8);
  }

  public boolean isConfigured() {
    return StringUtils.hasText(appId) && StringUtils.hasText(appKey);
  }
}
