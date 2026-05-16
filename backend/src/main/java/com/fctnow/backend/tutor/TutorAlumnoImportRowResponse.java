package com.fctnow.backend.tutor;

public record TutorAlumnoImportRowResponse(
    int fila,
    String email,
    String displayName,
    String estado,
    String mensaje) {
}
