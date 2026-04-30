package com.fctnow.backend.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Instant;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Tag(name = "Health", description = "Backend availability checks")
public class HealthController {

  @GetMapping("/health")
  @Operation(summary = "Check backend availability")
  public HealthResponse health() {
    return new HealthResponse("UP", "fctnow-backend", Instant.now());
  }

  public record HealthResponse(String status, String service, Instant timestamp) {
  }
}
