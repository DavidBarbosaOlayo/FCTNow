package com.fctnow.backend.ofertas;

import com.fctnow.backend.empresas.Empresa;
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
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "ofertas_fct")
public class OfertaFct {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "empresa_id", nullable = false)
  private Empresa empresa;

  @Column(nullable = false, length = 150)
  private String titulo;

  @Column(nullable = false, length = 2000)
  private String descripcion;

  @Column(name = "familia_profesional", nullable = false, length = 150)
  private String familiaProfesional;

  @Column(name = "ciclo_formativo", length = 150)
  private String cicloFormativo;

  @Column(nullable = false, length = 100)
  private String localidad;

  @Column(nullable = false, length = 100)
  private String provincia;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private OfertaModalidad modalidad;

  @Column(name = "fecha_inicio", nullable = false)
  private LocalDate fechaInicio;

  @Column(name = "fecha_fin", nullable = false)
  private LocalDate fechaFin;

  @Column(nullable = false)
  private Integer plazas;

  @Column(length = 2000)
  private String requisitos;

  @Column(nullable = false, length = 2000)
  private String tareas;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 50)
  private OfertaEstado estado;

  @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
  private Instant updatedAt;

  protected OfertaFct() {
  }

  public OfertaFct(
      Empresa empresa,
      String titulo,
      String descripcion,
      String familiaProfesional,
      String cicloFormativo,
      String localidad,
      String provincia,
      OfertaModalidad modalidad,
      LocalDate fechaInicio,
      LocalDate fechaFin,
      Integer plazas,
      String requisitos,
      String tareas,
      OfertaEstado estado) {
    this.empresa = empresa;
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.familiaProfesional = familiaProfesional;
    this.cicloFormativo = cicloFormativo;
    this.localidad = localidad;
    this.provincia = provincia;
    this.modalidad = modalidad;
    this.fechaInicio = fechaInicio;
    this.fechaFin = fechaFin;
    this.plazas = plazas;
    this.requisitos = requisitos;
    this.tareas = tareas;
    this.estado = estado;
  }

  public void updateContent(
      String titulo,
      String descripcion,
      String familiaProfesional,
      String cicloFormativo,
      String localidad,
      String provincia,
      OfertaModalidad modalidad,
      LocalDate fechaInicio,
      LocalDate fechaFin,
      Integer plazas,
      String requisitos,
      String tareas) {
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.familiaProfesional = familiaProfesional;
    this.cicloFormativo = cicloFormativo;
    this.localidad = localidad;
    this.provincia = provincia;
    this.modalidad = modalidad;
    this.fechaInicio = fechaInicio;
    this.fechaFin = fechaFin;
    this.plazas = plazas;
    this.requisitos = requisitos;
    this.tareas = tareas;
  }

  public void changeEstado(OfertaEstado estado) {
    this.estado = estado;
  }

  public Long getId() {
    return id;
  }

  public Empresa getEmpresa() {
    return empresa;
  }

  public String getTitulo() {
    return titulo;
  }

  public String getDescripcion() {
    return descripcion;
  }

  public String getFamiliaProfesional() {
    return familiaProfesional;
  }

  public String getCicloFormativo() {
    return cicloFormativo;
  }

  public String getLocalidad() {
    return localidad;
  }

  public String getProvincia() {
    return provincia;
  }

  public OfertaModalidad getModalidad() {
    return modalidad;
  }

  public LocalDate getFechaInicio() {
    return fechaInicio;
  }

  public LocalDate getFechaFin() {
    return fechaFin;
  }

  public Integer getPlazas() {
    return plazas;
  }

  public String getRequisitos() {
    return requisitos;
  }

  public String getTareas() {
    return tareas;
  }

  public OfertaEstado getEstado() {
    return estado;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
