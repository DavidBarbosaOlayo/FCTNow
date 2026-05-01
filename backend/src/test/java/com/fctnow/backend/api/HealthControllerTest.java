package com.fctnow.backend.api;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class HealthControllerTest {

  @Test
  void healthReturnsBackendStatus() {
    var response = new HealthController().health();

    assertThat(response.status()).isEqualTo("UP");
    assertThat(response.service()).isEqualTo("fctnow-backend");
    assertThat(response.timestamp()).isNotNull();
  }
}
