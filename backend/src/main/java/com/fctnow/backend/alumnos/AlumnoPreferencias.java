package com.fctnow.backend.alumnos;

import com.fctnow.backend.ofertas.OfertaModalidad;
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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "alumno_preferencias")
public class AlumnoPreferencias {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @OneToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "alumno_id", nullable = false, unique = true)
  private UserAccount alumno;

  @Column(name = "familia_profesional", length = 150)
  private String familiaProfesional;

  @Column(name = "ciclo_formativo", length = 150)
  private String cicloFormativo;

  @Column(name = "localidad_preferida", length = 150)
  private String localidadPreferida;

  @Enumerated(EnumType.STRING)
  @Column(name = "modalidad_preferida", length = 50)
  private OfertaModalidad modalidadPreferida;

  @Column(name = "fecha_disponibilidad")
  private LocalDate fechaDisponibilidad;

  @Column(length = 1000)
  private String observaciones;

  @Column(name = "cv_file_name")
  private String cvFileName;

  @Column(name = "cv_content_type", length = 100)
  private String cvContentType;

  @Column(name = "cv_size")
  private Long cvSize;

  @Column(name = "cv_content")
  private byte[] cvContent;

  @Column(name = "cv_updated_at")
  private Instant cvUpdatedAt;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected AlumnoPreferencias() {
  }

  public AlumnoPreferencias(UserAccount alumno) {
    this.alumno = alumno;
    this.createdAt = Instant.now();
    this.updatedAt = this.createdAt;
  }

  public void update(
      String familiaProfesional,
      String cicloFormativo,
      String localidadPreferida,
      OfertaModalidad modalidadPreferida,
      LocalDate fechaDisponibilidad,
      String observaciones) {
    this.familiaProfesional = familiaProfesional;
    this.cicloFormativo = cicloFormativo;
    this.localidadPreferida = localidadPreferida;
    this.modalidadPreferida = modalidadPreferida;
    this.fechaDisponibilidad = fechaDisponibilidad;
    this.observaciones = observaciones;
    this.updatedAt = Instant.now();
  }

  public void updateCv(String fileName, String contentType, byte[] content) {
    this.cvFileName = fileName;
    this.cvContentType = contentType;
    this.cvSize = (long) content.length;
    this.cvContent = content;
    this.cvUpdatedAt = Instant.now();
    this.updatedAt = this.cvUpdatedAt;
  }

  public Long getId() {
    return id;
  }

  public UserAccount getAlumno() {
    return alumno;
  }

  public String getFamiliaProfesional() {
    return familiaProfesional;
  }

  public String getCicloFormativo() {
    return cicloFormativo;
  }

  public String getLocalidadPreferida() {
    return localidadPreferida;
  }

  public OfertaModalidad getModalidadPreferida() {
    return modalidadPreferida;
  }

  public LocalDate getFechaDisponibilidad() {
    return fechaDisponibilidad;
  }

  public String getObservaciones() {
    return observaciones;
  }

  public String getCvFileName() {
    return cvFileName;
  }

  public String getCvContentType() {
    return cvContentType;
  }

  public Long getCvSize() {
    return cvSize;
  }

  public byte[] getCvContent() {
    return cvContent;
  }

  public Instant getCvUpdatedAt() {
    return cvUpdatedAt;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
