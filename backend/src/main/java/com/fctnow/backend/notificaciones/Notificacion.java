package com.fctnow.backend.notificaciones;

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
import java.time.Instant;

@Entity
@Table(name = "notificaciones")
public class Notificacion {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "alumno_id", nullable = false)
  private UserAccount alumno;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "recomendada_por")
  private UserAccount recomendadaPor;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 50)
  private NotificacionTipo tipo;

  @Column(nullable = false, length = 500)
  private String titulo;

  @Column(length = 2000)
  private String mensaje;

  @Column(name = "action_url", length = 2000)
  private String actionUrl;

  @Column(name = "action_label", length = 150)
  private String actionLabel;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "oferta_id")
  private OfertaFct oferta;

  @Column(name = "oferta_externa_titulo", length = 500)
  private String ofertaExternaTitulo;

  @Column(name = "oferta_externa_empresa", length = 500)
  private String ofertaExternaEmpresa;

  @Column(name = "oferta_externa_url", length = 2000)
  private String ofertaExternaUrl;

  @Column(name = "oferta_externa_localidad", length = 255)
  private String ofertaExternaLocalidad;

  @Column(nullable = false)
  private boolean leida = false;

  @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
  private Instant createdAt;

  protected Notificacion() {
  }

  public Notificacion(
      UserAccount alumno,
      UserAccount recomendadaPor,
      NotificacionTipo tipo,
      String titulo,
      String mensaje,
      String actionUrl,
      String actionLabel,
      OfertaFct oferta,
      String ofertaExternaTitulo,
      String ofertaExternaEmpresa,
      String ofertaExternaUrl,
      String ofertaExternaLocalidad) {
    this.alumno = alumno;
    this.recomendadaPor = recomendadaPor;
    this.tipo = tipo;
    this.titulo = titulo;
    this.mensaje = mensaje;
    this.actionUrl = actionUrl;
    this.actionLabel = actionLabel;
    this.oferta = oferta;
    this.ofertaExternaTitulo = ofertaExternaTitulo;
    this.ofertaExternaEmpresa = ofertaExternaEmpresa;
    this.ofertaExternaUrl = ofertaExternaUrl;
    this.ofertaExternaLocalidad = ofertaExternaLocalidad;
  }

  public void marcarLeida() {
    this.leida = true;
  }

  public Long getId() {
    return id;
  }

  public UserAccount getAlumno() {
    return alumno;
  }

  public UserAccount getRecomendadaPor() {
    return recomendadaPor;
  }

  public NotificacionTipo getTipo() {
    return tipo;
  }

  public String getTitulo() {
    return titulo;
  }

  public String getMensaje() {
    return mensaje;
  }

  public String getActionUrl() {
    return actionUrl;
  }

  public String getActionLabel() {
    return actionLabel;
  }

  public OfertaFct getOferta() {
    return oferta;
  }

  public String getOfertaExternaTitulo() {
    return ofertaExternaTitulo;
  }

  public String getOfertaExternaEmpresa() {
    return ofertaExternaEmpresa;
  }

  public String getOfertaExternaUrl() {
    return ofertaExternaUrl;
  }

  public String getOfertaExternaLocalidad() {
    return ofertaExternaLocalidad;
  }

  public boolean isLeida() {
    return leida;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
