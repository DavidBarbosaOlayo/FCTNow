package com.fctnow.backend.tutor;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TutorAlumnoCreateRequest(
    @NotBlank
    @Size(max = 150)
    String displayName,

    @NotBlank
    @Size(max = 180)
    String username,

    @NotBlank
    @Size(min = 8, max = 100)
    String password,

    @NotBlank
    @Email
    @Size(max = 254)
    String centroEmail) {
}
