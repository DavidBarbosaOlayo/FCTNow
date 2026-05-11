package com.fctnow.backend.mensajes;

import com.fctnow.backend.user.UserAccount;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "mensajes")
public class Mensaje {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "conversacion_id", nullable = false)
  private Conversacion conversacion;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "remitente_id", nullable = false)
  private UserAccount remitente;

  @Column(nullable = false, length = 2000)
  private String contenido;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt = Instant.now();

  protected Mensaje() {
  }

  public Mensaje(Conversacion conversacion, UserAccount remitente, String contenido) {
    this.conversacion = conversacion;
    this.remitente = remitente;
    this.contenido = contenido.trim();
  }

  public Long getId() {
    return id;
  }

  public Conversacion getConversacion() {
    return conversacion;
  }

  public UserAccount getRemitente() {
    return remitente;
  }

  public String getContenido() {
    return contenido;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
