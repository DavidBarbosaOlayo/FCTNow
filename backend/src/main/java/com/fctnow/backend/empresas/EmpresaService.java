package com.fctnow.backend.empresas;

import com.fctnow.backend.user.UserAccount;
import com.fctnow.backend.user.UserAccountRepository;
import com.fctnow.backend.user.UserRole;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EmpresaService {

  private final EmpresaRepository empresaRepository;
  private final UserAccountRepository userAccountRepository;

  public EmpresaService(
      EmpresaRepository empresaRepository,
      UserAccountRepository userAccountRepository) {
    this.empresaRepository = empresaRepository;
    this.userAccountRepository = userAccountRepository;
  }

  @Transactional(readOnly = true)
  public List<EmpresaResponse> findAll() {
    return empresaRepository.findAll(Sort.by(Sort.Order.asc("nombre"), Sort.Order.asc("id")))
        .stream()
        .map(EmpresaResponse::from)
        .toList();
  }

  @Transactional(readOnly = true)
  public EmpresaResponse findById(Long id) {
    return empresaRepository.findById(id)
        .map(EmpresaResponse::from)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Empresa no encontrada"));
  }

  @Transactional(readOnly = true)
  public EmpresaResponse findMine(JwtAuthenticationToken authentication) {
    return EmpresaResponse.from(currentEmpresa(authentication));
  }

  @Transactional
  public EmpresaResponse create(EmpresaRequest request) {
    String identificadorFiscal = normalizeFiscalId(request.identificadorFiscal());

    if (empresaRepository.existsByIdentificadorFiscalIgnoreCase(identificadorFiscal)) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "Ya existe una empresa con ese identificador fiscal");
    }

    Empresa empresa = new Empresa(
        required(request.nombre()),
        request.tipoIdentificadorFiscal(),
        identificadorFiscal,
        required(request.sector()),
        optional(request.descripcion()),
        required(request.direccion()),
        required(request.localidad()),
        required(request.provincia()),
        required(request.codigoPostal()),
        normalizeEmail(request.emailContacto()),
        optional(request.telefonoContacto()),
        required(request.personaContacto()),
        request.estado());

    return EmpresaResponse.from(empresaRepository.save(empresa));
  }

  @Transactional
  public EmpresaResponse update(Long id, EmpresaRequest request) {
    Empresa empresa = empresaRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Empresa no encontrada"));

    String identificadorFiscal = normalizeFiscalId(request.identificadorFiscal());
    if (empresaRepository.existsByIdentificadorFiscalIgnoreCaseAndIdNot(identificadorFiscal, id)) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "Ya existe una empresa con ese identificador fiscal");
    }

    empresa.update(
        required(request.nombre()),
        request.tipoIdentificadorFiscal(),
        identificadorFiscal,
        required(request.sector()),
        optional(request.descripcion()),
        required(request.direccion()),
        required(request.localidad()),
        required(request.provincia()),
        required(request.codigoPostal()),
        normalizeEmail(request.emailContacto()),
        optional(request.telefonoContacto()),
        required(request.personaContacto()),
        request.estado());

    return EmpresaResponse.from(empresa);
  }

  @Transactional
  public EmpresaResponse updateMine(
      EmpresaPerfilRequest request,
      JwtAuthenticationToken authentication) {
    Empresa empresa = currentEmpresa(authentication);

    String identificadorFiscal = normalizeFiscalId(request.identificadorFiscal());
    if (empresaRepository.existsByIdentificadorFiscalIgnoreCaseAndIdNot(
        identificadorFiscal,
        empresa.getId())) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "Ya existe una empresa con ese identificador fiscal");
    }

    empresa.update(
        required(request.nombre()),
        request.tipoIdentificadorFiscal(),
        identificadorFiscal,
        required(request.sector()),
        optional(request.descripcion()),
        required(request.direccion()),
        required(request.localidad()),
        required(request.provincia()),
        required(request.codigoPostal()),
        normalizeEmail(request.emailContacto()),
        optional(request.telefonoContacto()),
        required(request.personaContacto()),
        empresa.getEstado());

    return EmpresaResponse.from(empresa);
  }

  private Empresa currentEmpresa(JwtAuthenticationToken authentication) {
    UserAccount userAccount = userAccountRepository.findByEmailIgnoreCase(authentication.getName())
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.UNAUTHORIZED,
            "Sesion no valida"));

    if (!userAccount.getRoles().contains(UserRole.EMPRESA)) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          "Solo las empresas pueden acceder a su perfil de empresa");
    }

    Long empresaId = userAccount.getEmpresaId();
    if (empresaId == null) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          "El usuario no esta vinculado a ninguna empresa");
    }

    return empresaRepository.findById(empresaId)
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Empresa asociada no encontrada"));
  }

  private String required(String value) {
    return value.trim();
  }

  private String optional(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }

    return value.trim();
  }

  private String normalizeFiscalId(String value) {
    return required(value).toUpperCase(Locale.ROOT);
  }

  private String normalizeEmail(String value) {
    return required(value).toLowerCase(Locale.ROOT);
  }
}
