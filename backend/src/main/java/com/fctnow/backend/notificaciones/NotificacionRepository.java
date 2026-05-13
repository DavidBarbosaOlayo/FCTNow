package com.fctnow.backend.notificaciones;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {

  @Query("""
      select n
      from Notificacion n
      left join fetch n.oferta o
      left join fetch o.empresa
      where n.destinatario.id = :alumnoId
      order by n.createdAt desc, n.id desc
      """)
  List<Notificacion> findByAlumnoIdWithOfertaOrderByCreatedAtDesc(@Param("alumnoId") Long alumnoId);

  @Query("""
      select n
      from Notificacion n
      left join fetch n.oferta o
      left join fetch o.empresa
      where n.destinatario.id = :destinatarioId
      order by n.createdAt desc, n.id desc
      """)
  List<Notificacion> findByDestinatarioIdWithOfertaOrderByCreatedAtDesc(
      @Param("destinatarioId") Long destinatarioId);

  Optional<Notificacion> findByIdAndDestinatarioId(Long id, Long destinatarioId);

  boolean existsByDestinatarioIdAndTipoAndOfertaId(
      Long destinatarioId,
      NotificacionTipo tipo,
      Long ofertaId);

  @Query("""
      select count(n) > 0
      from Notificacion n
      where n.destinatario.id = :alumnoId
        and n.tipo = :tipo
        and lower(n.ofertaExternaUrl) = lower(:url)
      """)
  boolean existsExternalRecommendation(
      @Param("alumnoId") Long alumnoId,
      @Param("tipo") NotificacionTipo tipo,
      @Param("url") String url);
}
