package com.fctnow.backend.user;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "app_users")
public class UserAccount {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 254)
  private String email;

  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  @Column(name = "display_name", nullable = false, length = 150)
  private String displayName;

  @Column(nullable = false)
  private boolean enabled = true;

  @Column(name = "empresa_id")
  private Long empresaId;

  @Column(name = "centro_email", length = 254)
  private String centroEmail;

  @ElementCollection(fetch = FetchType.EAGER)
  @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
  @Enumerated(EnumType.STRING)
  @Column(name = "role", nullable = false, length = 50)
  private Set<UserRole> roles = new LinkedHashSet<>();

  @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
  private Instant createdAt;

  protected UserAccount() {
  }

  public UserAccount(
      String email,
      String passwordHash,
      String displayName,
      Set<UserRole> roles) {
    this(email, passwordHash, displayName, roles, null, null);
  }

  public UserAccount(
      String email,
      String passwordHash,
      String displayName,
      Set<UserRole> roles,
      Long empresaId) {
    this(email, passwordHash, displayName, roles, empresaId, null);
  }

  public UserAccount(
      String email,
      String passwordHash,
      String displayName,
      Set<UserRole> roles,
      Long empresaId,
      String centroEmail) {
    this.email = email;
    this.passwordHash = passwordHash;
    this.displayName = displayName;
    this.roles = new LinkedHashSet<>(roles);
    this.empresaId = empresaId;
    this.centroEmail = centroEmail;
  }

  public void linkToEmpresa(Long empresaId) {
    this.empresaId = empresaId;
  }

  public void updateCentroEmail(String centroEmail) {
    this.centroEmail = centroEmail;
  }

  public Long getId() {
    return id;
  }

  public String getEmail() {
    return email;
  }

  public String getPasswordHash() {
    return passwordHash;
  }

  public String getDisplayName() {
    return displayName;
  }

  public boolean isEnabled() {
    return enabled;
  }

  public Set<UserRole> getRoles() {
    return Set.copyOf(roles);
  }

  public Long getEmpresaId() {
    return empresaId;
  }

  public String getCentroEmail() {
    return centroEmail;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
