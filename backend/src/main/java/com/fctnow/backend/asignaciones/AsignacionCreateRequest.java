package com.fctnow.backend.asignaciones;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record AsignacionCreateRequest(
    @NotNull Long solicitudId,
    @Size(max = 2000) String observaciones,
    @NotNull @Min(40) @Max(1000) Integer horasTotales,
    @NotNull @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd") LocalDate fechaInicio,
    @NotNull @Min(1) @Max(12) Integer horasDiariasEstimadas,
    @NotNull Boolean remunerada,
    @DecimalMin(value = "0.00", inclusive = true) @Digits(integer = 8, fraction = 2) BigDecimal importeMensual,
    @Size(max = 2000) String observacionesRetribucion) {
}
