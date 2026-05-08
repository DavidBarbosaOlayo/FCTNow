package com.fctnow.backend.solicitudes;

import jakarta.validation.constraints.NotNull;

public record SolicitudEstadoChangeRequest(@NotNull SolicitudEstado estado) {
}
