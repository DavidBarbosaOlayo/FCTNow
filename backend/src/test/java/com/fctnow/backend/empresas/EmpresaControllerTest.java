package com.fctnow.backend.empresas;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fctnow.backend.auth.LoginRequest;
import com.fctnow.backend.ofertas.OfertaFctRepository;
import com.fctnow.backend.solicitudes.SolicitudFctRepository;
import com.fctnow.backend.user.UserAccount;
import com.fctnow.backend.user.UserAccountRepository;
import com.fctnow.backend.user.UserRole;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class EmpresaControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Autowired
  private PasswordEncoder passwordEncoder;

  @Autowired
  private UserAccountRepository userAccountRepository;

  @Autowired
  private EmpresaRepository empresaRepository;

  @Autowired
  private OfertaFctRepository ofertaFctRepository;

  @Autowired
  private SolicitudFctRepository solicitudFctRepository;

  private Long linkedEmpresaId;

  @BeforeEach
  void setUp() {
    solicitudFctRepository.deleteAll();
    ofertaFctRepository.deleteAll();
    userAccountRepository.deleteAll();
    empresaRepository.deleteAll();

    linkedEmpresaId = empresaRepository.save(company(
        "Empresa Vinculada",
        "B99999999",
        EmpresaEstado.ACTIVA))
        .getId();

    userAccountRepository.save(new UserAccount(
        "coordinador@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Coordinador Demo",
        Set.of(UserRole.COORDINADOR)));

    userAccountRepository.save(new UserAccount(
        "empresa@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Empresa Demo",
        Set.of(UserRole.EMPRESA),
        linkedEmpresaId));

    userAccountRepository.save(new UserAccount(
        "empresa-sin-vinculo@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Empresa Sin Vinculo",
        Set.of(UserRole.EMPRESA),
        null));
  }

  @Test
  void listRequiresAuthentication() throws Exception {
    mockMvc.perform(get("/api/empresas"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void mineRequiresAuthentication() throws Exception {
    mockMvc.perform(get("/api/empresas/me"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void mineReturnsAuthenticatedCompanyProfile() throws Exception {
    mockMvc.perform(get("/api/empresas/me")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(linkedEmpresaId.intValue()))
        .andExpect(jsonPath("$.nombre").value("Empresa Vinculada"))
        .andExpect(jsonPath("$.identificadorFiscal").value("B99999999"));
  }

  @Test
  void mineRejectsNonEmpresaRole() throws Exception {
    mockMvc.perform(get("/api/empresas/me")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("coordinador@example.com")))
        .andExpect(status().isForbidden());
  }

  @Test
  void mineRejectsEmpresaWithoutLinkedCompany() throws Exception {
    mockMvc.perform(get("/api/empresas/me")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa-sin-vinculo@example.com")))
        .andExpect(status().isForbidden());
  }

  @Test
  void updateMineChangesAuthenticatedCompanyProfile() throws Exception {
    mockMvc.perform(put("/api/empresas/me")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(validPerfilRequest(
                "Empresa Perfil Actualizada",
                "b12312312"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(linkedEmpresaId.intValue()))
        .andExpect(jsonPath("$.nombre").value("Empresa Perfil Actualizada"))
        .andExpect(jsonPath("$.identificadorFiscal").value("B12312312"))
        .andExpect(jsonPath("$.emailContacto").value("contacto@perfil.example"))
        .andExpect(jsonPath("$.estado").value("ACTIVA"));
  }

  @Test
  void updateMineRejectsInvalidPayload() throws Exception {
    mockMvc.perform(put("/api/empresas/me")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(validPerfilRequest(
                "",
                "B12312312"))))
        .andExpect(status().isBadRequest());
  }

  @Test
  void updateMineRejectsDuplicateFiscalId() throws Exception {
    empresaRepository.save(company(
        "Empresa Duplicada",
        "B11111111",
        EmpresaEstado.ACTIVA));

    mockMvc.perform(put("/api/empresas/me")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(validPerfilRequest(
                "Empresa Perfil",
                "b11111111"))))
        .andExpect(status().isConflict());
  }

  @Test
  void listReturnsCompanies() throws Exception {
    empresaRepository.save(company(
        "Zeta Formacion",
        "B11111111",
        EmpresaEstado.ACTIVA));
    empresaRepository.save(company(
        "Alfa Practicas",
        "B22222222",
        EmpresaEstado.INACTIVA));

    mockMvc.perform(get("/api/empresas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(3))
        .andExpect(jsonPath("$[0].nombre").value("Alfa Practicas"))
        .andExpect(jsonPath("$[0].identificadorFiscal").value("B22222222"))
        .andExpect(jsonPath("$[1].nombre").value("Empresa Vinculada"))
        .andExpect(jsonPath("$[2].nombre").value("Zeta Formacion"));
  }

  @Test
  void detailReturnsCompany() throws Exception {
    Long empresaId = empresaRepository.save(company(
        "Tech Norte Formacion",
        "B12345678",
        EmpresaEstado.ACTIVA))
        .getId();

    mockMvc.perform(get("/api/empresas/{id}", empresaId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(empresaId))
        .andExpect(jsonPath("$.nombre").value("Tech Norte Formacion"))
        .andExpect(jsonPath("$.estado").value("ACTIVA"));
  }

  @Test
  void detailReturnsNotFound() throws Exception {
    mockMvc.perform(get("/api/empresas/{id}", 99999)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken()))
        .andExpect(status().isNotFound());
  }

  @Test
  void createPersistsCompany() throws Exception {
    mockMvc.perform(post("/api/empresas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken())
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(validRequest(
                "Nueva Empresa FCT",
                " b76543210 ",
                EmpresaEstado.ACTIVA))))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.nombre").value("Nueva Empresa FCT"))
        .andExpect(jsonPath("$.identificadorFiscal").value("B76543210"))
        .andExpect(jsonPath("$.emailContacto").value("contacto@nueva.example"))
        .andExpect(jsonPath("$.estado").value("ACTIVA"));
  }

  @Test
  void createRejectsInvalidPayload() throws Exception {
    mockMvc.perform(post("/api/empresas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken())
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(validRequest(
                "",
                "B76543210",
                EmpresaEstado.ACTIVA))))
        .andExpect(status().isBadRequest());
  }

  @Test
  void createRejectsDuplicateFiscalId() throws Exception {
    empresaRepository.save(company(
        "Empresa Existente",
        "B12345678",
        EmpresaEstado.ACTIVA));

    mockMvc.perform(post("/api/empresas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken())
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(validRequest(
                "Empresa Duplicada",
                "b12345678",
                EmpresaEstado.ACTIVA))))
        .andExpect(status().isConflict());
  }

  @Test
  void updateChangesCompany() throws Exception {
    Long empresaId = empresaRepository.save(company(
        "Empresa Original",
        "B12345678",
        EmpresaEstado.ACTIVA))
        .getId();

    mockMvc.perform(put("/api/empresas/{id}", empresaId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken())
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(validRequest(
                "Empresa Actualizada",
                "B87654321",
                EmpresaEstado.INACTIVA))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(empresaId))
        .andExpect(jsonPath("$.nombre").value("Empresa Actualizada"))
        .andExpect(jsonPath("$.identificadorFiscal").value("B87654321"))
        .andExpect(jsonPath("$.estado").value("INACTIVA"));
  }

  @Test
  void updateReturnsNotFound() throws Exception {
    mockMvc.perform(put("/api/empresas/{id}", 99999)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken())
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(validRequest(
                "Empresa Inexistente",
                "B76543210",
                EmpresaEstado.ACTIVA))))
        .andExpect(status().isNotFound());
  }

  @Test
  void updateRejectsDuplicateFiscalId() throws Exception {
    empresaRepository.save(company(
        "Empresa Uno",
        "B11111111",
        EmpresaEstado.ACTIVA));
    Long secondCompanyId = empresaRepository.save(company(
        "Empresa Dos",
        "B22222222",
        EmpresaEstado.ACTIVA))
        .getId();

    mockMvc.perform(put("/api/empresas/{id}", secondCompanyId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken())
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(validRequest(
                "Empresa Dos",
                "b11111111",
                EmpresaEstado.ACTIVA))))
        .andExpect(status().isConflict());
  }

  private EmpresaRequest validRequest(
      String nombre,
      String identificadorFiscal,
      EmpresaEstado estado) {
    return new EmpresaRequest(
        nombre,
        IdentificadorFiscalTipo.CIF,
        identificadorFiscal,
        "Desarrollo de software",
        "Empresa colaboradora para practicas FCT.",
        "Calle Mayor 12",
        "Valencia",
        "Valencia",
        "46001",
        "CONTACTO@NUEVA.EXAMPLE",
        "960000000",
        "Laura Garcia",
        estado);
  }

  private EmpresaPerfilRequest validPerfilRequest(
      String nombre,
      String identificadorFiscal) {
    return new EmpresaPerfilRequest(
        nombre,
        IdentificadorFiscalTipo.CIF,
        identificadorFiscal,
        "Desarrollo de software",
        "Empresa colaboradora para practicas FCT.",
        "Calle Perfil 4",
        "Valencia",
        "Valencia",
        "46002",
        "CONTACTO@PERFIL.EXAMPLE",
        "961111111",
        "Marta Ruiz");
  }

  private Empresa company(
      String nombre,
      String identificadorFiscal,
      EmpresaEstado estado) {
    return new Empresa(
        nombre,
        IdentificadorFiscalTipo.CIF,
        identificadorFiscal,
        "Desarrollo de software",
        "Empresa colaboradora para practicas FCT.",
        "Calle Mayor 12",
        "Valencia",
        "Valencia",
        "46001",
        "contacto@empresa.example",
        "960000000",
        "Laura Garcia",
        estado);
  }

  private String accessToken() throws Exception {
    return accessToken("coordinador@example.com");
  }

  private String accessToken(String email) throws Exception {
    String loginResponse = mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(
                new LoginRequest(email, "CorrectPassword123!"))))
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString();

    return objectMapper.readTree(loginResponse).get("accessToken").asText();
  }
}
