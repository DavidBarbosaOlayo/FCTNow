package com.fctnow.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

  @Bean
  OpenAPI fctNowOpenApi() {
    return new OpenAPI()
        .info(new Info()
            .title("FCTNow Backend API")
            .version("v0.1.0")
            .description("Base REST API for the FCTNow backend."));
  }
}
