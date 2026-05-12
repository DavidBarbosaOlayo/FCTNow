package com.fctnow.backend.mensajes;

import jakarta.validation.constraints.NotNull;

public record ConversacionCreateRequest(
    @NotNull
    Long contactoId) {
}
