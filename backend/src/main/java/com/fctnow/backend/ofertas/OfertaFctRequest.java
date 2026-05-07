package com.fctnow.backend.ofertas;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record OfertaFctRequest(
    @NotBlank
    @Size(max = 150)
    String titulo,

    @NotBlank
    @Size(max = 2000)
    String descripcion,

    @NotBlank
    @Size(max = 150)
    String familiaProfesional,

    @Size(max = 150)
    String cicloFormativo,

    @NotBlank
    @Size(max = 100)
    String localidad,

    @NotBlank
    @Size(max = 100)
    String provincia,

    @NotNull
    OfertaModalidad modalidad,

    @NotNull
    LocalDate fechaInicio,

    @NotNull
    LocalDate fechaFin,

    @NotNull
    @Min(value = 1, message = "Las plazas deben ser al menos 1")
    Integer plazas,

    @Size(max = 2000)
    String requisitos,

    @NotBlank
    @Size(max = 2000)
    String tareas) {
}
