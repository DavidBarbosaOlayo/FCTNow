package com.fctnow.backend.ofertas;

import jakarta.validation.constraints.NotNull;

public record OfertaEstadoChangeRequest(@NotNull OfertaEstado estado) {
}
