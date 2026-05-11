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
@Table(name = "conversaciones")
public class Conversacion {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(length = 180)
  private String titulo;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "participante_a_id", nullable = false)
  private UserAccount participanteA;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "participante_b_id", nullable = false)
  private UserAccount participanteB;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt = Instant.now();

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt = Instant.now();

  protected Conversacion() {
  }

  public Conversacion(String titulo, UserAccount participanteA, UserAccount participanteB) {
    this.titulo = blankToNull(titulo);
    this.participanteA = participanteA;
    this.participanteB = participanteB;
  }

  public void touch() {
    this.updatedAt = Instant.now();
  }

  public Long getId() {
    return id;
  }

  public String getTitulo() {
    return titulo;
  }

  public UserAccount getParticipanteA() {
    return participanteA;
  }

  public UserAccount getParticipanteB() {
    return participanteB;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public boolean hasParticipant(Long userId) {
    return participanteA.getId().equals(userId) || participanteB.getId().equals(userId);
  }

  public UserAccount otherParticipant(Long userId) {
    return participanteA.getId().equals(userId) ? participanteB : participanteA;
  }

  private String blankToNull(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    return value.trim();
  }
}
