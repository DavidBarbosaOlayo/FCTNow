package com.fctnow.backend.alumnos;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AlumnoPreferenciasRepository extends JpaRepository<AlumnoPreferencias, Long> {

  Optional<AlumnoPreferencias> findByAlumnoId(Long alumnoId);
}
