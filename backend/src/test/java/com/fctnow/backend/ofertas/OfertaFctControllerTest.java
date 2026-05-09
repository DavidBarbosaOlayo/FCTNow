package com.fctnow.backend.ofertas;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fctnow.backend.auth.LoginRequest;
import com.fctnow.backend.empresas.Empresa;
import com.fctnow.backend.empresas.EmpresaEstado;
import com.fctnow.backend.empresas.EmpresaRepository;
import com.fctnow.backend.empresas.IdentificadorFiscalTipo;
import com.fctnow.backend.user.UserAccount;
import com.fctnow.backend.user.UserAccountRepository;
import com.fctnow.backend.user.UserRole;
import java.time.LocalDate;
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
class OfertaFctControllerTest {

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

  private Long publishedOfferId;
  private Long draftOfferId;

  @BeforeEach
  void setUp() {
    ofertaFctRepository.deleteAll();
    userAccountRepository.deleteAll();
    empresaRepository.deleteAll();

    userAccountRepository.save(new UserAccount(
        "alumno@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Alumno Demo",
        Set.of(UserRole.ALUMNO)));

    Empresa techCompany = empresaRepository.save(new Empresa(
        "Tech Norte Formacion",
        IdentificadorFiscalTipo.CIF,
        "B12345678",
        "Desarrollo de software",
        "Empresa colaboradora especializada en aplicaciones web.",
        "Calle Mayor 12",
        "Valencia",
        "Valencia",
        "46001",
        "fct@technorte.example",
        "960000000",
        "Laura Garcia",
        EmpresaEstado.ACTIVA));

    Empresa logisticsCompany = empresaRepository.save(new Empresa(
        "Logistica Levante",
        IdentificadorFiscalTipo.CIF,
        "B11223344",
        "Logistica",
        "Operador logistico con actividad en almacen e inventario.",
        "Poligono Sur 8",
        "Castellon",
        "Castellon",
        "12006",
        "rrhh@logisticalevante.example",
        "964000000",
        "Carlos Vidal",
        EmpresaEstado.ACTIVA));

    publishedOfferId = ofertaFctRepository.save(new OfertaFct(
            techCompany,
            "Practicas de analisis de datos",
            "Apoyo en cuadros de mando y revision de datos operativos.",
            "Informatica y comunicaciones",
            "Desarrollo de Aplicaciones Multiplataforma",
            "Valencia",
            "Valencia",
            OfertaModalidad.HIBRIDA,
            LocalDate.of(2026, 9, 15),
            LocalDate.of(2026, 12, 15),
            2,
            "Conocimientos basicos de SQL y hojas de calculo.",
            "Preparacion de informes, validacion de datos y documentacion tecnica.",
            OfertaEstado.PUBLICADA))
        .getId();

    ofertaFctRepository.save(new OfertaFct(
        logisticsCompany,
        "Gestion de almacen",
        "Participacion en recepcion de mercancias y control de stock.",
        "Comercio y marketing",
        "Actividades Comerciales",
        "Castellon",
        "Castellon",
        OfertaModalidad.PRESENCIAL,
        LocalDate.of(2026, 10, 1),
        LocalDate.of(2027, 1, 20),
        1,
        "Interes por operaciones y organizacion.",
        "Control de inventario, preparacion de pedidos y apoyo documental.",
        OfertaEstado.PUBLICADA));

    draftOfferId = ofertaFctRepository.save(new OfertaFct(
            techCompany,
            "Oferta pendiente de revision",
            "Oferta no visible todavia en el catalogo.",
            "Informatica y comunicaciones",
            "Desarrollo de Aplicaciones Web",
            "Valencia",
            "Valencia",
            OfertaModalidad.PRESENCIAL,
            LocalDate.of(2026, 11, 1),
            LocalDate.of(2027, 2, 1),
            1,
            "Pendiente de revisar.",
            "Pendiente de validar por el centro.",
            OfertaEstado.BORRADOR))
        .getId();
  }

  @Test
  void listAllowsAnonymousAccess() throws Exception {
    mockMvc.perform(get("/api/ofertas"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(2));
  }

  @Test
  void listReturnsOnlyPublishedOffers() throws Exception {
    mockMvc.perform(get("/api/ofertas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(2))
        .andExpect(jsonPath("$[0].estado").value("PUBLICADA"))
        .andExpect(jsonPath("$[1].estado").value("PUBLICADA"))
        .andExpect(jsonPath("$[0].titulo").value("Practicas de analisis de datos"))
        .andExpect(jsonPath("$[0].empresaNombre").value("Tech Norte Formacion"));
  }

  @Test
  void listFiltersPublishedOffers() throws Exception {
    mockMvc.perform(get("/api/ofertas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken())
            .param("q", "datos")
            .param("familiaProfesional", "Informatica y comunicaciones")
            .param("localidad", "Valencia")
            .param("modalidad", "HIBRIDA"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].id").value(publishedOfferId))
        .andExpect(jsonPath("$[0].modalidad").value("HIBRIDA"));
  }

  @Test
  void detailReturnsPublishedOffer() throws Exception {
    mockMvc.perform(get("/api/ofertas/{id}", publishedOfferId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(publishedOfferId))
        .andExpect(jsonPath("$.titulo").value("Practicas de analisis de datos"))
        .andExpect(jsonPath("$.familiaProfesional").value("Informatica y comunicaciones"))
        .andExpect(jsonPath("$.plazas").value(2));
  }

  @Test
  void detailDoesNotExposeDraftOffer() throws Exception {
    mockMvc.perform(get("/api/ofertas/{id}", draftOfferId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken()))
        .andExpect(status().isNotFound());
  }

  private String accessToken() throws Exception {
    String loginResponse = mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(
                new LoginRequest("alumno@example.com", "CorrectPassword123!"))))
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString();

    return objectMapper.readTree(loginResponse).get("accessToken").asText();
  }
}
