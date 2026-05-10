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
      where n.alumno.id = :alumnoId
      order by n.createdAt desc, n.id desc
      """)
  List<Notificacion> findByAlumnoIdWithOfertaOrderByCreatedAtDesc(@Param("alumnoId") Long alumnoId);

  Optional<Notificacion> findByIdAndAlumnoId(Long id, Long alumnoId);

  boolean existsByAlumnoIdAndTipoAndOfertaId(
      Long alumnoId,
      NotificacionTipo tipo,
      Long ofertaId);

  @Query("""
      select count(n) > 0
      from Notificacion n
      where n.alumno.id = :alumnoId
        and n.tipo = :tipo
        and lower(n.ofertaExternaUrl) = lower(:url)
      """)
  boolean existsExternalRecommendation(
      @Param("alumnoId") Long alumnoId,
      @Param("tipo") NotificacionTipo tipo,
      @Param("url") String url);
}
