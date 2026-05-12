package com.fctnow.backend.mensajes;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MensajeRequest(
    @NotBlank
    @Size(max = 2000)
    String contenido) {
}
