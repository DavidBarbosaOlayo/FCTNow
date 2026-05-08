package com.fctnow.backend.empresas;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record EmpresaPerfilRequest(
    @NotBlank
    @Size(max = 150)
    String nombre,

    @NotNull
    IdentificadorFiscalTipo tipoIdentificadorFiscal,

    @NotBlank
    @Size(max = 20)
    String identificadorFiscal,

    @NotBlank
    @Size(max = 100)
    String sector,

    @Size(max = 1000)
    String descripcion,

    @NotBlank
    @Size(max = 200)
    String direccion,

    @NotBlank
    @Size(max = 100)
    String localidad,

    @NotBlank
    @Size(max = 100)
    String provincia,

    @NotBlank
    @Pattern(regexp = "\\d{5}", message = "El codigo postal debe tener 5 digitos")
    String codigoPostal,

    @NotBlank
    @Email
    @Size(max = 254)
    String emailContacto,

    @Size(max = 30)
    String telefonoContacto,

    @NotBlank
    @Size(max = 150)
    String personaContacto) {
}
