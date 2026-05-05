package com.fctnow.backend.ofertas;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OfertaFctRepository extends JpaRepository<OfertaFct, Long> {

  @Query("""
      select o
      from OfertaFct o
      join fetch o.empresa e
      where o.estado = :estado
        and (:query is null
          or lower(o.titulo) like :query
          or lower(o.descripcion) like :query
          or lower(o.tareas) like :query
          or lower(e.nombre) like :query)
        and (:familiaProfesional is null or lower(o.familiaProfesional) = :familiaProfesional)
        and (:localidad is null or lower(o.localidad) = :localidad)
        and (:modalidad is null or o.modalidad = :modalidad)
      order by o.fechaInicio asc, o.id asc
      """)
  List<OfertaFct> findCatalogOffers(
      @Param("estado") OfertaEstado estado,
      @Param("query") String query,
      @Param("familiaProfesional") String familiaProfesional,
      @Param("localidad") String localidad,
      @Param("modalidad") OfertaModalidad modalidad);

  @Query("""
      select o
      from OfertaFct o
      join fetch o.empresa
      where o.id = :id and o.estado = :estado
      """)
  Optional<OfertaFct> findByIdAndEstadoWithEmpresa(
      @Param("id") Long id,
      @Param("estado") OfertaEstado estado);
}
