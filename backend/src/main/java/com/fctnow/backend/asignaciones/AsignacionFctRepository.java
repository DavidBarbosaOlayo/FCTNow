package com.fctnow.backend.asignaciones;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AsignacionFctRepository extends JpaRepository<AsignacionFct, Long> {

  boolean existsBySolicitudId(Long solicitudId);

  @Query("""
      select a
      from AsignacionFct a
      join fetch a.solicitud
      join fetch a.alumno
      join fetch a.oferta
      join fetch a.empresa
      order by a.fechaAsignacion desc, a.id desc
      """)
  List<AsignacionFct> findAllWithDetails();

  @Query("""
      select a
      from AsignacionFct a
      where a.solicitud.id in :solicitudIds
      """)
  List<AsignacionFct> findBySolicitudIdIn(@Param("solicitudIds") Collection<Long> solicitudIds);
}
