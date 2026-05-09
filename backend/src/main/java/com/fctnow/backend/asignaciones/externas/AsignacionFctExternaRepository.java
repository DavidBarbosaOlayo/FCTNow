package com.fctnow.backend.asignaciones.externas;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AsignacionFctExternaRepository extends JpaRepository<AsignacionFctExterna, Long> {

  boolean existsBySolicitudId(Long solicitudId);

  @Query("""
      SELECT a
      FROM AsignacionFctExterna a
      JOIN FETCH a.solicitud s
      JOIN FETCH a.alumno
      ORDER BY a.fechaAsignacion DESC""")
  List<AsignacionFctExterna> findAllWithDetails();
}
