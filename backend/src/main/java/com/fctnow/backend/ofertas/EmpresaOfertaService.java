package com.fctnow.backend.ofertas;

import com.fctnow.backend.empresas.Empresa;
import com.fctnow.backend.empresas.EmpresaRepository;
import com.fctnow.backend.user.UserAccount;
import com.fctnow.backend.user.UserAccountRepository;
import com.fctnow.backend.user.UserRole;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EmpresaOfertaService {

  private static final Map<OfertaEstado, Set<OfertaEstado>> ALLOWED_TRANSITIONS =
      new EnumMap<>(OfertaEstado.class);

  static {
    ALLOWED_TRANSITIONS.put(OfertaEstado.BORRADOR, EnumSet.of(OfertaEstado.PUBLICADA, OfertaEstado.CERRADA));
    ALLOWED_TRANSITIONS.put(OfertaEstado.PUBLICADA, EnumSet.of(OfertaEstado.CERRADA));
  }

  private final OfertaFctRepository ofertaFctRepository;
  private final EmpresaRepository empresaRepository;
  private final UserAccountRepository userAccountRepository;

  public EmpresaOfertaService(
      OfertaFctRepository ofertaFctRepository,
      EmpresaRepository empresaRepository,
      UserAccountRepository userAccountRepository) {
    this.ofertaFctRepository = ofertaFctRepository;
    this.empresaRepository = empresaRepository;
    this.userAccountRepository = userAccountRepository;
  }

  @Transactional(readOnly = true)
  public List<OfertaFctResponse> findMine(JwtAuthenticationToken authentication) {
    Long empresaId = currentEmpresaId(authentication);

    return ofertaFctRepository.findByEmpresaIdWithEmpresa(empresaId).stream()
        .map(OfertaFctResponse::from)
        .toList();
  }

  @Transactional
  public OfertaFctResponse create(OfertaFctRequest request, JwtAuthenticationToken authentication) {
    Long empresaId = currentEmpresaId(authentication);
    validateDateRange(request.fechaInicio(), request.fechaFin());

    Empresa empresa = empresaRepository.findById(empresaId)
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Empresa asociada no encontrada"));

    OfertaFct oferta = new OfertaFct(
        empresa,
        trim(request.titulo()),
        trim(request.descripcion()),
        trim(request.familiaProfesional()),
        optional(request.cicloFormativo()),
        trim(request.localidad()),
        trim(request.provincia()),
        request.modalidad(),
        request.fechaInicio(),
        request.fechaFin(),
        request.plazas(),
        optional(request.requisitos()),
        trim(request.tareas()),
        OfertaEstado.BORRADOR);

    return OfertaFctResponse.from(ofertaFctRepository.save(oferta));
  }

  @Transactional
  public OfertaFctResponse update(
      Long id,
      OfertaFctRequest request,
      JwtAuthenticationToken authentication) {
    OfertaFct oferta = findOwned(id, authentication);

    if (oferta.getEstado() != OfertaEstado.BORRADOR) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "Solo se pueden editar ofertas en estado BORRADOR");
    }

    validateDateRange(request.fechaInicio(), request.fechaFin());

    oferta.updateContent(
        trim(request.titulo()),
        trim(request.descripcion()),
        trim(request.familiaProfesional()),
        optional(request.cicloFormativo()),
        trim(request.localidad()),
        trim(request.provincia()),
        request.modalidad(),
        request.fechaInicio(),
        request.fechaFin(),
        request.plazas(),
        optional(request.requisitos()),
        trim(request.tareas()));

    return OfertaFctResponse.from(oferta);
  }

  @Transactional
  public OfertaFctResponse changeEstado(
      Long id,
      OfertaEstadoChangeRequest request,
      JwtAuthenticationToken authentication) {
    OfertaFct oferta = findOwned(id, authentication);
    OfertaEstado actual = oferta.getEstado();
    OfertaEstado destino = request.estado();

    if (actual == destino) {
      return OfertaFctResponse.from(oferta);
    }

    Set<OfertaEstado> allowed = ALLOWED_TRANSITIONS.getOrDefault(actual, EnumSet.noneOf(OfertaEstado.class));
    if (!allowed.contains(destino)) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "Transicion de estado no permitida: " + actual + " -> " + destino);
    }

    oferta.changeEstado(destino);
    return OfertaFctResponse.from(oferta);
  }

  @Transactional
  public void delete(Long id, JwtAuthenticationToken authentication) {
    OfertaFct oferta = findOwned(id, authentication);

    if (oferta.getEstado() != OfertaEstado.BORRADOR) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "Solo se pueden eliminar ofertas en estado BORRADOR");
    }

    ofertaFctRepository.delete(oferta);
  }

  private OfertaFct findOwned(Long id, JwtAuthenticationToken authentication) {
    Long empresaId = currentEmpresaId(authentication);
    return ofertaFctRepository.findByIdAndEmpresaIdWithEmpresa(id, empresaId)
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Oferta no encontrada"));
  }

  private Long currentEmpresaId(JwtAuthenticationToken authentication) {
    UserAccount userAccount = userAccountRepository.findByEmailIgnoreCase(authentication.getName())
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.UNAUTHORIZED,
            "Sesion no valida"));

    if (!userAccount.getRoles().contains(UserRole.EMPRESA)) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          "Solo las empresas pueden gestionar ofertas FCT");
    }

    Long empresaId = userAccount.getEmpresaId();
    if (empresaId == null) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          "El usuario no esta vinculado a ninguna empresa");
    }

    return empresaId;
  }

  private void validateDateRange(java.time.LocalDate inicio, java.time.LocalDate fin) {
    if (inicio.isAfter(fin)) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "La fecha de inicio debe ser anterior o igual a la fecha de fin");
    }
  }

  private String trim(String value) {
    return value.trim();
  }

  private String optional(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    return value.trim();
  }
}
