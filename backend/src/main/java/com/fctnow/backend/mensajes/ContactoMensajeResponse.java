package com.fctnow.backend.mensajes;

public record ContactoMensajeResponse(
    Long id,
    String displayName,
    String familiaProfesional,
    String cicloFormativo) {
}
