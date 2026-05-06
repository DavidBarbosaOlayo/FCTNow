package com.fctnow.backend.empresas;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmpresaRepository extends JpaRepository<Empresa, Long> {

  Optional<Empresa> findByIdentificadorFiscalIgnoreCase(String identificadorFiscal);

  boolean existsByIdentificadorFiscalIgnoreCase(String identificadorFiscal);

  boolean existsByIdentificadorFiscalIgnoreCaseAndIdNot(String identificadorFiscal, Long id);
}
