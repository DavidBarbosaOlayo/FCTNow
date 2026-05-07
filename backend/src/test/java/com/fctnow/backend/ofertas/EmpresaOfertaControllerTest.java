package com.fctnow.backend.ofertas;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fctnow.backend.auth.LoginRequest;
import com.fctnow.backend.empresas.Empresa;
import com.fctnow.backend.empresas.EmpresaEstado;
import com.fctnow.backend.empresas.EmpresaRepository;
import com.fctnow.backend.empresas.IdentificadorFiscalTipo;
import com.fctnow.backend.solicitudes.SolicitudFctRepository;
import com.fctnow.backend.user.UserAccount;
import com.fctnow.backend.user.UserAccountRepository;
import com.fctnow.backend.user.UserRole;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
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
class EmpresaOfertaControllerTest {

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

  private Long empresaAId;
  private Long empresaBId;
  private Long borradorOfferIdEmpresaA;
  private Long publicadaOfferIdEmpresaA;
  private Long borradorOfferIdEmpresaB;

  @BeforeEach
  void setUp() {
    solicitudFctRepository.deleteAll();
    ofertaFctRepository.deleteAll();
    userAccountRepository.deleteAll();
    empresaRepository.deleteAll();

    Empresa empresaA = empresaRepository.save(new Empresa(
        "Tech Norte Formacion",
        IdentificadorFiscalTipo.CIF,
        "B12345678",
        "Desarrollo de software",
        "Empresa colaboradora",
        "Calle Mayor 12",
        "Valencia",
        "Valencia",
        "46001",
        "fct@technorte.example",
        "960000000",
        "Laura Garcia",
        EmpresaEstado.ACTIVA));
    empresaAId = empresaA.getId();

    Empresa empresaB = empresaRepository.save(new Empresa(
        "Logistica Levante",
        IdentificadorFiscalTipo.CIF,
        "B11223344",
        "Logistica",
        "Operador logistico",
        "Poligono Sur 8",
        "Castellon",
        "Castellon",
        "12006",
        "rrhh@logisticalevante.example",
        "964000000",
        "Carlos Vidal",
        EmpresaEstado.ACTIVA));
    empresaBId = empresaB.getId();

    userAccountRepository.save(new UserAccount(
        "empresa-a@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Empresa A",
        Set.of(UserRole.EMPRESA),
        empresaAId));

    userAccountRepository.save(new UserAccount(
        "empresa-b@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Empresa B",
        Set.of(UserRole.EMPRESA),
        empresaBId));

    userAccountRepository.save(new UserAccount(
        "empresa-sin-empresa@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Empresa Sin Vinculo",
        Set.of(UserRole.EMPRESA),
        null));

    userAccountRepository.save(new UserAccount(
        "alumno@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Alumno Demo",
        Set.of(UserRole.ALUMNO)));

    borradorOfferIdEmpresaA = ofertaFctRepository.save(new OfertaFct(
            empresaA,
            "Borrador empresa A",
            "Descripcion de borrador.",
            "Informatica y comunicaciones",
            "Desarrollo de Aplicaciones Web",
            "Valencia",
            "Valencia",
            OfertaModalidad.PRESENCIAL,
            LocalDate.of(2026, 9, 15),
            LocalDate.of(2026, 12, 15),
            2,
            "Conocimientos basicos.",
            "Tareas variadas.",
            OfertaEstado.BORRADOR))
        .getId();

    publicadaOfferIdEmpresaA = ofertaFctRepository.save(new OfertaFct(
            empresaA,
            "Publicada empresa A",
            "Descripcion publicada.",
            "Informatica y comunicaciones",
            "Sistemas Microinformaticos y Redes",
            "Valencia",
            "Valencia",
            OfertaModalidad.HIBRIDA,
            LocalDate.of(2026, 10, 1),
            LocalDate.of(2027, 1, 20),
            1,
            null,
            "Soporte y documentacion.",
            OfertaEstado.PUBLICADA))
        .getId();

    borradorOfferIdEmpresaB = ofertaFctRepository.save(new OfertaFct(
            empresaB,
            "Borrador empresa B",
            "Descripcion empresa B.",
            "Comercio y marketing",
            "Actividades Comerciales",
            "Castellon",
            "Castellon",
            OfertaModalidad.PRESENCIAL,
            LocalDate.of(2026, 9, 25),
            LocalDate.of(2026, 12, 18),
            2,
            null,
            "Atencion al cliente.",
            OfertaEstado.BORRADOR))
        .getId();
  }

  @Test
  void listMineRequiresAuthentication() throws Exception {
    mockMvc.perform(get("/api/empresas/me/ofertas"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void listMineReturnsOnlyOwnOffers() throws Exception {
    mockMvc.perform(get("/api/empresas/me/ofertas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa-a@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(2))
        .andExpect(jsonPath("$[0].empresaId").value(empresaAId.intValue()))
        .andExpect(jsonPath("$[1].empresaId").value(empresaAId.intValue()));
  }

  @Test
  void listMineRejectsAlumno() throws Exception {
    mockMvc.perform(get("/api/empresas/me/ofertas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno@example.com")))
        .andExpect(status().isForbidden());
  }

  @Test
  void listMineRejectsEmpresaWithoutEmpresaId() throws Exception {
    mockMvc.perform(get("/api/empresas/me/ofertas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa-sin-empresa@example.com")))
        .andExpect(status().isForbidden());
  }

  @Test
  void createOfferStartsAsBorrador() throws Exception {
    mockMvc.perform(post("/api/empresas/me/ofertas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa-a@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(validRequest())))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.estado").value("BORRADOR"))
        .andExpect(jsonPath("$.empresaId").value(empresaAId.intValue()))
        .andExpect(jsonPath("$.titulo").value("Practicas de prueba"));
  }

  @Test
  void createOfferRejectsInvalidDateRange() throws Exception {
    Map<String, Object> body = validRequest();
    body.put("fechaInicio", "2026-12-15");
    body.put("fechaFin", "2026-09-15");

    mockMvc.perform(post("/api/empresas/me/ofertas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa-a@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest());
  }

  @Test
  void createOfferRejectsBlankTitle() throws Exception {
    Map<String, Object> body = validRequest();
    body.put("titulo", "  ");

    mockMvc.perform(post("/api/empresas/me/ofertas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa-a@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest());
  }

  @Test
  void updateOfferAllowsBorrador() throws Exception {
    Map<String, Object> body = validRequest();
    body.put("titulo", "Borrador editado");

    mockMvc.perform(put("/api/empresas/me/ofertas/{id}", borradorOfferIdEmpresaA)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa-a@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.titulo").value("Borrador editado"));
  }

  @Test
  void updateOfferRejectsPublicada() throws Exception {
    mockMvc.perform(put("/api/empresas/me/ofertas/{id}", publicadaOfferIdEmpresaA)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa-a@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(validRequest())))
        .andExpect(status().isConflict());
  }

  @Test
  void updateOfferDoesNotExposeOtherCompanyOffers() throws Exception {
    mockMvc.perform(put("/api/empresas/me/ofertas/{id}", borradorOfferIdEmpresaB)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa-a@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(validRequest())))
        .andExpect(status().isNotFound());
  }

  @Test
  void changeEstadoBorradorToPublicada() throws Exception {
    mockMvc.perform(patch("/api/empresas/me/ofertas/{id}/estado", borradorOfferIdEmpresaA)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa-a@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"estado\":\"PUBLICADA\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("PUBLICADA"));
  }

  @Test
  void changeEstadoPublicadaToCerrada() throws Exception {
    mockMvc.perform(patch("/api/empresas/me/ofertas/{id}/estado", publicadaOfferIdEmpresaA)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa-a@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"estado\":\"CERRADA\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("CERRADA"));
  }

  @Test
  void changeEstadoRejectsCerradaBackToBorrador() throws Exception {
    mockMvc.perform(patch("/api/empresas/me/ofertas/{id}/estado", publicadaOfferIdEmpresaA)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa-a@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"estado\":\"CERRADA\"}"))
        .andExpect(status().isOk());

    mockMvc.perform(patch("/api/empresas/me/ofertas/{id}/estado", publicadaOfferIdEmpresaA)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa-a@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"estado\":\"BORRADOR\"}"))
        .andExpect(status().isConflict());
  }

  @Test
  void changeEstadoOfOtherCompanyOfferIsNotFound() throws Exception {
    mockMvc.perform(patch("/api/empresas/me/ofertas/{id}/estado", borradorOfferIdEmpresaB)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa-a@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"estado\":\"PUBLICADA\"}"))
        .andExpect(status().isNotFound());
  }

  @Test
  void deleteAllowsBorrador() throws Exception {
    mockMvc.perform(delete("/api/empresas/me/ofertas/{id}", borradorOfferIdEmpresaA)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa-a@example.com")))
        .andExpect(status().isNoContent());
  }

  @Test
  void deleteRejectsPublicada() throws Exception {
    mockMvc.perform(delete("/api/empresas/me/ofertas/{id}", publicadaOfferIdEmpresaA)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa-a@example.com")))
        .andExpect(status().isConflict());
  }

  @Test
  void deleteOfOtherCompanyOfferIsNotFound() throws Exception {
    mockMvc.perform(delete("/api/empresas/me/ofertas/{id}", borradorOfferIdEmpresaB)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa-a@example.com")))
        .andExpect(status().isNotFound());
  }

  @Test
  void publicCatalogStillExposesOnlyPublicadaOffers() throws Exception {
    mockMvc.perform(get("/api/ofertas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].id").value(publicadaOfferIdEmpresaA));
  }

  private Map<String, Object> validRequest() {
    Map<String, Object> body = new HashMap<>();
    body.put("titulo", "Practicas de prueba");
    body.put("descripcion", "Descripcion de prueba.");
    body.put("familiaProfesional", "Informatica y comunicaciones");
    body.put("cicloFormativo", "Desarrollo de Aplicaciones Web");
    body.put("localidad", "Valencia");
    body.put("provincia", "Valencia");
    body.put("modalidad", "PRESENCIAL");
    body.put("fechaInicio", "2026-09-15");
    body.put("fechaFin", "2026-12-15");
    body.put("plazas", 2);
    body.put("requisitos", null);
    body.put("tareas", "Tareas de prueba.");
    return body;
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
