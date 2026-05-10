package com.fctnow.backend.solicitudes.externas;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SolicitudExternaRepository extends JpaRepository<SolicitudExterna, Long> {

  Optional<SolicitudExterna> findByAlumnoIdAndFuenteAndIdExterno(
      Long alumnoId,
      SolicitudExternaFuente fuente,
      String idExterno);

  @Query("""
      SELECT s
      FROM SolicitudExterna s
      WHERE s.alumno.id IN :alumnoIds
      """)
  List<SolicitudExterna> findByAlumnoIdIn(@Param("alumnoIds") Collection<Long> alumnoIds);

  @Query("""
      SELECT s
      FROM SolicitudExterna s
      JOIN FETCH s.alumno
      WHERE s.alumno.id = :alumnoId
      ORDER BY s.updatedAt DESC""")
  List<SolicitudExterna> findByAlumnoIdWithDetails(Long alumnoId);

  @Query("""
      SELECT s
      FROM SolicitudExterna s
      JOIN FETCH s.alumno
      WHERE s.estado = com.fctnow.backend.solicitudes.externas.SolicitudExternaEstado.ACEPTADA
        AND NOT EXISTS (
          SELECT 1 FROM AsignacionFctExterna a WHERE a.solicitud.id = s.id
        )
      ORDER BY s.updatedAt DESC""")
  List<SolicitudExterna> findAceptadasSinAsignacion();
}
