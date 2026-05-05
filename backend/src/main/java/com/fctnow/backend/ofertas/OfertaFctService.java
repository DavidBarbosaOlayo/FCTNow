package com.fctnow.backend.ofertas;

import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OfertaFctService {

  private final OfertaFctRepository ofertaFctRepository;

  public OfertaFctService(OfertaFctRepository ofertaFctRepository) {
    this.ofertaFctRepository = ofertaFctRepository;
  }

  public List<OfertaFctResponse> findPublishedOffers(OfertaFctFilters filters) {
    return ofertaFctRepository.findCatalogOffers(
            OfertaEstado.PUBLICADA,
            likePattern(filters.q()),
            normalized(filters.familiaProfesional()),
            normalized(filters.localidad()),
            filters.modalidad())
        .stream()
        .map(OfertaFctResponse::from)
        .toList();
  }

  public OfertaFctResponse findPublishedOffer(Long id) {
    return ofertaFctRepository.findByIdAndEstadoWithEmpresa(id, OfertaEstado.PUBLICADA)
        .map(OfertaFctResponse::from)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Oferta no encontrada"));
  }

  private String likePattern(String value) {
    String normalized = normalized(value);
    return normalized == null ? null : "%" + normalized + "%";
  }

  private String normalized(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }

    return value.trim().toLowerCase(Locale.ROOT);
  }
}
