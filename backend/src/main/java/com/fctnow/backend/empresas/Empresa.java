package com.fctnow.backend.empresas;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "empresas")
public class Empresa {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 150)
  private String nombre;

  @Enumerated(EnumType.STRING)
  @Column(name = "tipo_identificador_fiscal", nullable = false, length = 20)
  private IdentificadorFiscalTipo tipoIdentificadorFiscal;

  @Column(name = "identificador_fiscal", nullable = false, unique = true, length = 20)
  private String identificadorFiscal;

  @Column(nullable = false, length = 100)
  private String sector;

  @Column(length = 1000)
  private String descripcion;

  @Column(nullable = false, length = 200)
  private String direccion;

  @Column(nullable = false, length = 100)
  private String localidad;

  @Column(nullable = false, length = 100)
  private String provincia;

  @Column(name = "codigo_postal", nullable = false, length = 5)
  private String codigoPostal;

  @Column(name = "email_contacto", nullable = false, length = 254)
  private String emailContacto;

  @Column(name = "telefono_contacto", length = 30)
  private String telefonoContacto;

  @Column(name = "persona_contacto", nullable = false, length = 150)
  private String personaContacto;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 50)
  private EmpresaEstado estado;

  @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
  private Instant updatedAt;

  protected Empresa() {
  }

  public Empresa(
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
      EmpresaEstado estado) {
    this.nombre = nombre;
    this.tipoIdentificadorFiscal = tipoIdentificadorFiscal;
    this.identificadorFiscal = identificadorFiscal;
    this.sector = sector;
    this.descripcion = descripcion;
    this.direccion = direccion;
    this.localidad = localidad;
    this.provincia = provincia;
    this.codigoPostal = codigoPostal;
    this.emailContacto = emailContacto;
    this.telefonoContacto = telefonoContacto;
    this.personaContacto = personaContacto;
    this.estado = estado;
  }

  public void update(
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
      EmpresaEstado estado) {
    this.nombre = nombre;
    this.tipoIdentificadorFiscal = tipoIdentificadorFiscal;
    this.identificadorFiscal = identificadorFiscal;
    this.sector = sector;
    this.descripcion = descripcion;
    this.direccion = direccion;
    this.localidad = localidad;
    this.provincia = provincia;
    this.codigoPostal = codigoPostal;
    this.emailContacto = emailContacto;
    this.telefonoContacto = telefonoContacto;
    this.personaContacto = personaContacto;
    this.estado = estado;
  }

  public Long getId() {
    return id;
  }

  public String getNombre() {
    return nombre;
  }

  public IdentificadorFiscalTipo getTipoIdentificadorFiscal() {
    return tipoIdentificadorFiscal;
  }

  public String getIdentificadorFiscal() {
    return identificadorFiscal;
  }

  public String getSector() {
    return sector;
  }

  public String getDescripcion() {
    return descripcion;
  }

  public String getDireccion() {
    return direccion;
  }

  public String getLocalidad() {
    return localidad;
  }

  public String getProvincia() {
    return provincia;
  }

  public String getCodigoPostal() {
    return codigoPostal;
  }

  public String getEmailContacto() {
    return emailContacto;
  }

  public String getTelefonoContacto() {
    return telefonoContacto;
  }

  public String getPersonaContacto() {
    return personaContacto;
  }

  public EmpresaEstado getEstado() {
    return estado;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
