package com.fctnow.backend.config;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

@ConfigurationProperties(prefix = "fctnow.security.jwt")
public record JwtProperties(String issuer, String secret, Duration expiration) {

  public JwtProperties {
    issuer = StringUtils.hasText(issuer) ? issuer : "fctnow";
    expiration = expiration != null ? expiration : Duration.ofHours(1);

    if (!StringUtils.hasText(secret)
        || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
      throw new IllegalArgumentException("JWT secret must contain at least 32 bytes");
    }
  }
}
