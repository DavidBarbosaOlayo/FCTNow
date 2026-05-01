package com.fctnow.backend.auth;

import java.time.Instant;

public record ApiErrorResponse(String code, String message, Instant timestamp) {

  public static ApiErrorResponse of(String code, String message) {
    return new ApiErrorResponse(code, message, Instant.now());
  }
}
