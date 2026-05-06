package com.fctnow.backend.solicitudes;

import com.fctnow.backend.ofertas.OfertaEstado;
import com.fctnow.backend.ofertas.OfertaFct;
import com.fctnow.backend.ofertas.OfertaFctRepository;
import com.fctnow.backend.user.UserAccount;
import com.fctnow.backend.user.UserAccountRepository;
import com.fctnow.backend.user.UserRole;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SolicitudFctService {

  private final SolicitudFctRepository solicitudFctRepository;
  private final OfertaFctRepository ofertaFctRepository;
  private final UserAccountRepository userAccountRepository;

  public SolicitudFctService(
      SolicitudFctRepository solicitudFctRepository,
      OfertaFctRepository ofertaFctRepository,
      UserAccountRepository userAccountRepository) {
    this.solicitudFctRepository = solicitudFctRepository;
    this.ofertaFctRepository = ofertaFctRepository;
    this.userAccountRepository = userAccountRepository;
  }

  public List<SolicitudFctResponse> findMine(JwtAuthenticationToken authentication) {
    UserAccount alumno = currentAlumno(authentication);

    return solicitudFctRepository.findByAlumnoIdWithOferta(alumno.getId()).stream()
        .map(SolicitudFctResponse::from)
        .toList();
  }

  public SolicitudFctResponse requestOffer(Long ofertaId, JwtAuthenticationToken authentication) {
    UserAccount alumno = currentAlumno(authentication);
    OfertaFct oferta = ofertaFctRepository.findByIdAndEstadoWithEmpresa(
            ofertaId,
            OfertaEstado.PUBLICADA)
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Oferta no encontrada"));

    if (solicitudFctRepository.existsByAlumnoIdAndOfertaId(alumno.getId(), oferta.getId())) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "Ya has solicitado esta oferta");
    }

    return SolicitudFctResponse.from(solicitudFctRepository.save(new SolicitudFct(alumno, oferta)));
  }

  private UserAccount currentAlumno(JwtAuthenticationToken authentication) {
    UserAccount userAccount = userAccountRepository.findByEmailIgnoreCase(authentication.getName())
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.UNAUTHORIZED,
            "Sesion no valida"));

    if (!userAccount.getRoles().contains(UserRole.ALUMNO)) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          "Solo los alumnos pueden solicitar ofertas FCT");
    }

    return userAccount;
  }
}
