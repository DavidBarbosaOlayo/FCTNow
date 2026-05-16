package com.fctnow.backend.tutor;

import java.util.List;

public record TutorAlumnoImportResultResponse(
    int creados,
    int omitidos,
    int errores,
    List<TutorAlumnoImportRowResponse> filas) {
}
