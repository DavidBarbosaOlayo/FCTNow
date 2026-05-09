package com.fctnow.backend.solicitudes.externas;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public record SolicitudExternaCreateRequest(
    @NotNull SolicitudExternaFuente fuente,
    @NotBlank @Size(max = 255) String idExterno,
    @NotBlank @Size(max = 500) String titulo,
    @Size(max = 500) String empresaNombre,
    @Size(max = 255) String localidad,
    @Size(max = 255) String region,
    @NotBlank @Size(max = 2000) String urlAplicacion,
    Instant publicadoEn,
    @Size(max = 255) String categoria) {}
