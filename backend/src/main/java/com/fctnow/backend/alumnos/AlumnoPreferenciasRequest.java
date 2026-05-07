package com.fctnow.backend.alumnos;

import com.fctnow.backend.ofertas.OfertaModalidad;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record AlumnoPreferenciasRequest(
    @Size(max = 150) String familiaProfesional,
    @Size(max = 150) String cicloFormativo,
    @Size(max = 150) String localidadPreferida,
    OfertaModalidad modalidadPreferida,
    LocalDate fechaDisponibilidad,
    @Size(max = 1000) String observaciones) {
}
