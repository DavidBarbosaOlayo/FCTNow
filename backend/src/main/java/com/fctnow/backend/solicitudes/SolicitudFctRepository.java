package com.fctnow.backend.solicitudes;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SolicitudFctRepository extends JpaRepository<SolicitudFct, Long> {

  boolean existsByAlumnoIdAndOfertaId(Long alumnoId, Long ofertaId);

  @Query("""
      select s
      from SolicitudFct s
      where s.alumno.id in :alumnoIds
      """)
  List<SolicitudFct> findByAlumnoIdIn(@Param("alumnoIds") Collection<Long> alumnoIds);

  @Query("""
      select s
      from SolicitudFct s
      join fetch s.oferta o
      join fetch o.empresa
      where s.alumno.id = :alumnoId
      order by s.createdAt desc, s.id desc
      """)
  List<SolicitudFct> findByAlumnoIdWithOferta(@Param("alumnoId") Long alumnoId);

  @Query("""
      select s
      from SolicitudFct s
      join fetch s.oferta o
      join fetch o.empresa
      join fetch s.alumno
      where o.empresa.id = :empresaId
      order by s.createdAt desc, s.id desc
      """)
  List<SolicitudFct> findByEmpresaIdWithDetails(@Param("empresaId") Long empresaId);

  @Query("""
      select s
      from SolicitudFct s
      join fetch s.oferta o
      join fetch o.empresa
      join fetch s.alumno
      where s.id = :id and o.empresa.id = :empresaId
      """)
  Optional<SolicitudFct> findByIdAndEmpresaIdWithDetails(
      @Param("id") Long id,
      @Param("empresaId") Long empresaId);

  @Query("""
      select s
      from SolicitudFct s
      join fetch s.oferta o
      join fetch o.empresa
      join fetch s.alumno
      where s.estado = com.fctnow.backend.solicitudes.SolicitudEstado.ACEPTADA
        and not exists (
          select 1 from com.fctnow.backend.asignaciones.AsignacionFct a
          where a.solicitud = s
        )
      order by s.createdAt desc, s.id desc
      """)
  List<SolicitudFct> findAceptadasSinAsignacion();
}
