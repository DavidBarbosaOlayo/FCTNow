package com.fctnow.backend.asignaciones;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AsignacionFctRepository extends JpaRepository<AsignacionFct, Long> {

  boolean existsBySolicitudId(Long solicitudId);

  boolean existsByAlumnoIdAndEstado(Long alumnoId, AsignacionEstado estado);

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

  @Query("""
      select a
      from AsignacionFct a
      join fetch a.solicitud
      join fetch a.alumno
      join fetch a.oferta
      join fetch a.empresa
      where a.alumno.id in :alumnoIds
      order by a.fechaAsignacion desc, a.id desc
      """)
  List<AsignacionFct> findByAlumnoIdInWithDetails(@Param("alumnoIds") Collection<Long> alumnoIds);

  @Query("""
      select a
      from AsignacionFct a
      join fetch a.solicitud
      join fetch a.alumno
      join fetch a.oferta
      join fetch a.empresa
      where a.alumno.id = :alumnoId
        and a.estado = :estado
      order by a.fechaAsignacion desc, a.id desc
      """)
  Optional<AsignacionFct> findFirstByAlumnoIdAndEstadoWithDetails(
      @Param("alumnoId") Long alumnoId,
      @Param("estado") AsignacionEstado estado);
}
