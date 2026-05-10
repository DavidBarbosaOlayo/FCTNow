package com.fctnow.backend.asignaciones.externas;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AsignacionFctExternaRepository extends JpaRepository<AsignacionFctExterna, Long> {

  boolean existsBySolicitudId(Long solicitudId);

  @Query("""
      SELECT a
      FROM AsignacionFctExterna a
      JOIN FETCH a.solicitud s
      JOIN FETCH a.alumno
      ORDER BY a.fechaAsignacion DESC""")
  List<AsignacionFctExterna> findAllWithDetails();

  @Query("""
      SELECT a
      FROM AsignacionFctExterna a
      JOIN FETCH a.solicitud s
      JOIN FETCH a.alumno
      WHERE a.alumno.id IN :alumnoIds
      ORDER BY a.fechaAsignacion DESC""")
  List<AsignacionFctExterna> findByAlumnoIdInWithDetails(
      @Param("alumnoIds") Collection<Long> alumnoIds);
}
