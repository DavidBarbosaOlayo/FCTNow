package com.fctnow.backend.notificaciones;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notificaciones")
@Tag(name = "Notificaciones", description = "Avisos y recomendaciones para alumnado")
public class NotificacionController {

  private final NotificacionService notificacionService;

  public NotificacionController(NotificacionService notificacionService) {
    this.notificacionService = notificacionService;
  }

  @PostMapping("/recomendaciones")
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Create an offer recommendation for a student")
  @SecurityRequirement(name = "bearerAuth")
  public NotificacionResponse recomendar(
      @Valid @RequestBody RecomendacionRequest request,
      JwtAuthenticationToken authentication) {
    return notificacionService.createRecomendacion(request, authentication);
  }

  @GetMapping("/me")
  @Operation(summary = "List authenticated student's notifications")
  @SecurityRequirement(name = "bearerAuth")
  public List<NotificacionResponse> mine(JwtAuthenticationToken authentication) {
    return notificacionService.listMine(authentication);
  }

  @PatchMapping("/me/{id}/leida")
  @Operation(summary = "Mark a notification as read")
  @SecurityRequirement(name = "bearerAuth")
  public NotificacionResponse marcarLeida(
      @PathVariable Long id,
      JwtAuthenticationToken authentication) {
    return notificacionService.marcarLeida(id, authentication);
  }

  @DeleteMapping("/me/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Operation(summary = "Delete a notification")
  @SecurityRequirement(name = "bearerAuth")
  public void delete(
      @PathVariable Long id,
      JwtAuthenticationToken authentication) {
    notificacionService.delete(id, authentication);
  }
}
