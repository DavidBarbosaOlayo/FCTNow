package com.fctnow.backend.mensajes;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mensajes")
@Tag(name = "Mensajes", description = "Conversaciones simples entre usuarios")
public class MensajeController {

  private final MensajeService mensajeService;

  public MensajeController(MensajeService mensajeService) {
    this.mensajeService = mensajeService;
  }

  @GetMapping("/conversaciones")
  @Operation(summary = "List authenticated user's conversations")
  @SecurityRequirement(name = "bearerAuth")
  public List<ConversacionResponse> conversaciones(JwtAuthenticationToken authentication) {
    return mensajeService.listConversaciones(authentication);
  }

  @GetMapping("/contactos")
  @Operation(summary = "Search compatible contacts for starting a conversation")
  @SecurityRequirement(name = "bearerAuth")
  public List<ContactoMensajeResponse> contactos(
      @RequestParam(required = false) String nombre,
      JwtAuthenticationToken authentication) {
    return mensajeService.buscarContactos(nombre, authentication);
  }

  @PostMapping("/conversaciones")
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Create or reuse a conversation with a compatible contact")
  @SecurityRequirement(name = "bearerAuth")
  public ConversacionResponse crearConversacion(
      @Valid @RequestBody ConversacionCreateRequest request,
      JwtAuthenticationToken authentication) {
    return mensajeService.crearConversacion(request, authentication);
  }

  @GetMapping("/conversaciones/{id}")
  @Operation(summary = "List messages in a conversation")
  @SecurityRequirement(name = "bearerAuth")
  public List<MensajeResponse> mensajes(
      @PathVariable Long id,
      JwtAuthenticationToken authentication) {
    return mensajeService.listMensajes(id, authentication);
  }

  @PostMapping("/conversaciones/{id}/mensajes")
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Send a message to an existing conversation")
  @SecurityRequirement(name = "bearerAuth")
  public MensajeResponse enviar(
      @PathVariable Long id,
      @Valid @RequestBody MensajeRequest request,
      JwtAuthenticationToken authentication) {
    return mensajeService.enviar(id, request, authentication);
  }
}
