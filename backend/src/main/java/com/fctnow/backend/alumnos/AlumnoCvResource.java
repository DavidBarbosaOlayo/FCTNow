package com.fctnow.backend.alumnos;

public record AlumnoCvResource(
    String fileName,
    String contentType,
    byte[] content) {
}
