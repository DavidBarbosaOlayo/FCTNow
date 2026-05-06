package com.fctnow.backend.solicitudes;

import com.fctnow.backend.ofertas.OfertaFct;
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
    name = "solicitudes_fct",
    uniqueConstraints = @UniqueConstraint(name = "uk_solicitudes_fct_alumno_oferta",
        columnNames = {"alumno_id", "oferta_id"}))
public class SolicitudFct {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "alumno_id", nullable = false)
  private UserAccount alumno;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "oferta_id", nullable = false)
  private OfertaFct oferta;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 50)
  private SolicitudEstado estado;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected SolicitudFct() {
  }

  public SolicitudFct(UserAccount alumno, OfertaFct oferta) {
    this.alumno = alumno;
    this.oferta = oferta;
    this.estado = SolicitudEstado.SOLICITADA;
    this.createdAt = Instant.now();
  }

  public Long getId() {
    return id;
  }

  public UserAccount getAlumno() {
    return alumno;
  }

  public OfertaFct getOferta() {
    return oferta;
  }

  public SolicitudEstado getEstado() {
    return estado;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
