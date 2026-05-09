package com.fctnow.backend.solicitudes.externas;

import jakarta.validation.constraints.NotNull;

public record SolicitudExternaEstadoChangeRequest(@NotNull SolicitudExternaEstado estado) {}
