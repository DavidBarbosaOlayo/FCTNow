package com.fctnow.backend.solicitudes;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SolicitudFctRepository extends JpaRepository<SolicitudFct, Long> {

  boolean existsByAlumnoIdAndOfertaId(Long alumnoId, Long ofertaId);

  @Query("""
      select s
      from SolicitudFct s
      join fetch s.oferta o
      join fetch o.empresa
      where s.alumno.id = :alumnoId
      order by s.createdAt desc, s.id desc
      """)
  List<SolicitudFct> findByAlumnoIdWithOferta(@Param("alumnoId") Long alumnoId);
}
