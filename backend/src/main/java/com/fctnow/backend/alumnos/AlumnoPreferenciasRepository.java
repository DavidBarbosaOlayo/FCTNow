package com.fctnow.backend.alumnos;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AlumnoPreferenciasRepository extends JpaRepository<AlumnoPreferencias, Long> {

  Optional<AlumnoPreferencias> findByAlumnoId(Long alumnoId);

  @Query("""
      select p
      from AlumnoPreferencias p
      where p.alumno.id in :alumnoIds
      """)
  List<AlumnoPreferencias> findByAlumnoIdIn(@Param("alumnoIds") Collection<Long> alumnoIds);
}
