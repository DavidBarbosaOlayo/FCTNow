package com.fctnow.backend.mensajes;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MensajeRepository extends JpaRepository<Mensaje, Long> {

  @Query("""
      select m
      from Mensaje m
      join fetch m.remitente
      where m.conversacion.id = :conversacionId
      order by m.createdAt asc, m.id asc
      """)
  List<Mensaje> findByConversacionIdOrderByCreatedAtAsc(@Param("conversacionId") Long conversacionId);

  Optional<Mensaje> findFirstByConversacionIdOrderByCreatedAtDescIdDesc(Long conversacionId);
}
