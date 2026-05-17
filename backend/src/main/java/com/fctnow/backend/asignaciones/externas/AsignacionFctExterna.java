package com.fctnow.backend.asignaciones.externas;

import com.fctnow.backend.asignaciones.AsignacionEstado;
import com.fctnow.backend.solicitudes.externas.SolicitudExterna;
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
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(
    name = "asignaciones_fct_externas",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_asignaciones_fct_externas_solicitud",
        columnNames = {"solicitud_externa_id"}))
public class AsignacionFctExterna {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "solicitud_externa_id", nullable = false)
  private SolicitudExterna solicitud;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "alumno_id", nullable = false)
  private UserAccount alumno;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 50)
  private AsignacionEstado estado;

  @Column(length = 2000)
  private String observaciones;

  @Column(name = "fecha_asignacion", nullable = false)
  private Instant fechaAsignacion;

  @Column(name = "horas_totales", nullable = false)
  private int horasTotales;

  @Column(name = "fecha_inicio", nullable = false)
  private LocalDate fechaInicio;

  @Column(name = "horas_diarias_estimadas", nullable = false)
  private int horasDiariasEstimadas;

  @Column(nullable = false)
  private boolean remunerada;

  @Column(name = "importe_mensual", precision = 10, scale = 2)
  private BigDecimal importeMensual;

  @Column(name = "observaciones_retribucion", length = 2000)
  private String observacionesRetribucion;

  protected AsignacionFctExterna() {
  }

  public AsignacionFctExterna(
      SolicitudExterna solicitud,
      String observaciones,
      int horasTotales,
      LocalDate fechaInicio,
      int horasDiariasEstimadas,
      boolean remunerada,
      BigDecimal importeMensual,
      String observacionesRetribucion) {
    this.solicitud = solicitud;
    this.alumno = solicitud.getAlumno();
    this.estado = AsignacionEstado.ACTIVA;
    this.observaciones = observaciones;
    this.fechaAsignacion = Instant.now();
    this.horasTotales = horasTotales;
    this.fechaInicio = fechaInicio;
    this.horasDiariasEstimadas = horasDiariasEstimadas;
    this.remunerada = remunerada;
    this.importeMensual = importeMensual;
    this.observacionesRetribucion = observacionesRetribucion;
  }

  public Long getId() {
    return id;
  }

  public SolicitudExterna getSolicitud() {
    return solicitud;
  }

  public UserAccount getAlumno() {
    return alumno;
  }

  public AsignacionEstado getEstado() {
    return estado;
  }

  public String getObservaciones() {
    return observaciones;
  }

  public Instant getFechaAsignacion() {
    return fechaAsignacion;
  }

  public int getHorasTotales() {
    return horasTotales;
  }

  public LocalDate getFechaInicio() {
    return fechaInicio;
  }

  public int getHorasDiariasEstimadas() {
    return horasDiariasEstimadas;
  }

  public boolean isRemunerada() {
    return remunerada;
  }

  public BigDecimal getImporteMensual() {
    return importeMensual;
  }

  public String getObservacionesRetribucion() {
    return observacionesRetribucion;
  }
}
