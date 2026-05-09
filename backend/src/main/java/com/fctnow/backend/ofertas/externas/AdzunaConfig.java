package com.fctnow.backend.ofertas.externas;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.client.RestClientCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(AdzunaProperties.class)
public class AdzunaConfig {

  @Bean
  public RestClient adzunaRestClient(
      AdzunaProperties properties,
      RestClient.Builder builder,
      org.springframework.beans.factory.ObjectProvider<RestClientCustomizer> customizers) {
    SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
    int timeoutMillis = (int) properties.timeout().toMillis();
    requestFactory.setConnectTimeout(timeoutMillis);
    requestFactory.setReadTimeout(timeoutMillis);

    RestClient.Builder configured = builder
        .baseUrl(properties.baseUrl())
        .requestFactory(requestFactory);

    customizers.orderedStream().forEach(customizer -> customizer.customize(configured));

    return configured.build();
  }
}
