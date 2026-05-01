package com.fctnow.backend.auth;

import java.time.Instant;

public record LoginResponse(
    String tokenType,
    String accessToken,
    Instant expiresAt,
    AuthenticatedUserResponse user) {
}
