package com.fctnow.backend.solicitudes.externas;

import com.fctnow.backend.user.UserAccount;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;

@Entity
@Table(
    name = "solicitudes_externas",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_solicitudes_externas_alumno_fuente",
        columnNames = {"alumno_id", "fuente", "id_externo"}))
public class SolicitudExterna {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "alumno_id", nullable = false)
  private UserAccount alumno;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private SolicitudExternaFuente fuente;

  @Column(name = "id_externo", nullable = false, length = 255)
  private String idExterno;

  @Column(nullable = false, length = 500)
  private String titulo;

  @Column(name = "empresa_nombre", length = 500)
  private String empresaNombre;

  @Column(length = 255)
  private String localidad;

  @Column(length = 255)
  private String region;

  @Column(name = "url_aplicacion", nullable = false, length = 2000)
  private String urlAplicacion;

  @Column(name = "publicado_en")
  private Instant publicadoEn;

  @Column(length = 255)
  private String categoria;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 50)
  private SolicitudExternaEstado estado;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "actualizado_por", nullable = false)
  private UserAccount actualizadoPor;

  protected SolicitudExterna() {
  }

  public SolicitudExterna(
      UserAccount alumno,
      SolicitudExternaFuente fuente,
      String idExterno,
      String titulo,
      String empresaNombre,
      String localidad,
      String region,
      String urlAplicacion,
      Instant publicadoEn,
      String categoria,
      UserAccount actualizadoPor) {
    this.alumno = alumno;
    this.fuente = fuente;
    this.idExterno = idExterno;
    this.titulo = titulo;
    this.empresaNombre = empresaNombre;
    this.localidad = localidad;
    this.region = region;
    this.urlAplicacion = urlAplicacion;
    this.publicadoEn = publicadoEn;
    this.categoria = categoria;
    this.estado = SolicitudExternaEstado.SOLICITADA;
    Instant now = Instant.now();
    this.createdAt = now;
    this.updatedAt = now;
    this.actualizadoPor = actualizadoPor;
  }

  public Long getId() {
    return id;
  }

  public UserAccount getAlumno() {
    return alumno;
  }

  public SolicitudExternaFuente getFuente() {
    return fuente;
  }

  public String getIdExterno() {
    return idExterno;
  }

  public String getTitulo() {
    return titulo;
  }

  public String getEmpresaNombre() {
    return empresaNombre;
  }

  public String getLocalidad() {
    return localidad;
  }

  public String getRegion() {
    return region;
  }

  public String getUrlAplicacion() {
    return urlAplicacion;
  }

  public Instant getPublicadoEn() {
    return publicadoEn;
  }

  public String getCategoria() {
    return categoria;
  }

  public SolicitudExternaEstado getEstado() {
    return estado;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public UserAccount getActualizadoPor() {
    return actualizadoPor;
  }

  public void changeEstado(SolicitudExternaEstado nuevoEstado, UserAccount actualizadoPor) {
    this.estado = nuevoEstado;
    this.updatedAt = Instant.now();
    this.actualizadoPor = actualizadoPor;
  }

  public void refreshSnapshot(
      String titulo,
      String empresaNombre,
      String localidad,
      String region,
      String urlAplicacion,
      Instant publicadoEn,
      String categoria) {
    this.titulo = titulo;
    this.empresaNombre = empresaNombre;
    this.localidad = localidad;
    this.region = region;
    this.urlAplicacion = urlAplicacion;
    this.publicadoEn = publicadoEn;
    this.categoria = categoria;
    this.updatedAt = Instant.now();
  }
}
