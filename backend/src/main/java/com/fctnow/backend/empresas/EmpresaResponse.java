package com.fctnow.backend.empresas;

import java.time.Instant;

public record EmpresaResponse(
    Long id,
    String nombre,
    IdentificadorFiscalTipo tipoIdentificadorFiscal,
    String identificadorFiscal,
    String sector,
    String descripcion,
    String direccion,
    String localidad,
    String provincia,
    String codigoPostal,
    String emailContacto,
    String telefonoContacto,
    String personaContacto,
    EmpresaEstado estado,
    Instant createdAt,
    Instant updatedAt) {

  public static EmpresaResponse from(Empresa empresa) {
    return new EmpresaResponse(
        empresa.getId(),
        empresa.getNombre(),
        empresa.getTipoIdentificadorFiscal(),
        empresa.getIdentificadorFiscal(),
        empresa.getSector(),
        empresa.getDescripcion(),
        empresa.getDireccion(),
        empresa.getLocalidad(),
        empresa.getProvincia(),
        empresa.getCodigoPostal(),
        empresa.getEmailContacto(),
        empresa.getTelefonoContacto(),
        empresa.getPersonaContacto(),
        empresa.getEstado(),
        empresa.getCreatedAt(),
        empresa.getUpdatedAt());
  }
}
