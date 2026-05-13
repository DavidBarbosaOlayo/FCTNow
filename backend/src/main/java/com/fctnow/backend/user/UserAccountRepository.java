package com.fctnow.backend.user;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {

  Optional<UserAccount> findByEmailIgnoreCase(String email);

  @Query("""
      select distinct u
      from UserAccount u
      join u.roles r
      where r = :role
      """)
  List<UserAccount> findAllByRole(@Param("role") UserRole role);

  @Query("""
      select distinct u
      from UserAccount u
      join u.roles r
      where r = :role
        and u.empresaId = :empresaId
      """)
  List<UserAccount> findAllByRoleAndEmpresaId(
      @Param("role") UserRole role,
      @Param("empresaId") Long empresaId);
}
