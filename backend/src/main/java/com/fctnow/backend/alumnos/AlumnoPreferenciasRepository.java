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

  @Query("""
      select p
      from AlumnoPreferencias p
      join fetch p.alumno a
      where a.id <> :alumnoId
        and lower(p.familiaProfesional) = lower(:familiaProfesional)
      order by a.displayName asc
      """)
  List<AlumnoPreferencias> findCompatibleStudents(
      @Param("alumnoId") Long alumnoId,
      @Param("familiaProfesional") String familiaProfesional);
}
