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

  @Column(name = "foto_file_name", length = 255)
  private String fotoFileName;

  @Column(name = "foto_content_type", length = 100)
  private String fotoContentType;

  @Column(name = "foto_size")
  private Long fotoSize;

  @Column(name = "foto_content")
  private byte[] fotoContent;

  @Column(name = "foto_updated_at")
  private Instant fotoUpdatedAt;

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

  public void updateFoto(String fileName, String contentType, byte[] content) {
    this.fotoFileName = fileName;
    this.fotoContentType = contentType;
    this.fotoContent = content;
    this.fotoSize = content == null ? null : (long) content.length;
    this.fotoUpdatedAt = Instant.now();
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

  public String getFotoFileName() {
    return fotoFileName;
  }

  public String getFotoContentType() {
    return fotoContentType;
  }

  public Long getFotoSize() {
    return fotoSize;
  }

  public byte[] getFotoContent() {
    return fotoContent;
  }

  public Instant getFotoUpdatedAt() {
    return fotoUpdatedAt;
  }
}
