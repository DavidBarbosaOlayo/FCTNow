package com.fctnow.backend.mensajes;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ConversacionRepository extends JpaRepository<Conversacion, Long> {

  @Query("""
      select c
      from Conversacion c
      join fetch c.participanteA
      join fetch c.participanteB
      where c.participanteA.id = :userId or c.participanteB.id = :userId
      order by c.updatedAt desc, c.id desc
      """)
  List<Conversacion> findMineOrderByUpdatedAtDesc(@Param("userId") Long userId);

  @Query("""
      select c
      from Conversacion c
      join fetch c.participanteA
      join fetch c.participanteB
      where c.id = :id
        and (c.participanteA.id = :userId or c.participanteB.id = :userId)
      """)
  Optional<Conversacion> findMineById(
      @Param("id") Long id,
      @Param("userId") Long userId);

  @Query("""
      select c
      from Conversacion c
      join fetch c.participanteA
      join fetch c.participanteB
      where (c.participanteA.id = :userAId and c.participanteB.id = :userBId)
         or (c.participanteA.id = :userBId and c.participanteB.id = :userAId)
      """)
  Optional<Conversacion> findBetweenUsers(
      @Param("userAId") Long userAId,
      @Param("userBId") Long userBId);
}
