package com.fctnow.backend.solicitudes;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fctnow.backend.asignaciones.AsignacionFct;
import com.fctnow.backend.asignaciones.AsignacionFctRepository;
import com.fctnow.backend.auth.LoginRequest;
import com.fctnow.backend.empresas.Empresa;
import com.fctnow.backend.empresas.EmpresaEstado;
import com.fctnow.backend.empresas.EmpresaRepository;
import com.fctnow.backend.empresas.IdentificadorFiscalTipo;
import com.fctnow.backend.notificaciones.NotificacionRepository;
import com.fctnow.backend.ofertas.OfertaEstado;
import com.fctnow.backend.ofertas.OfertaFct;
import com.fctnow.backend.ofertas.OfertaFctRepository;
import com.fctnow.backend.ofertas.OfertaModalidad;
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
class SolicitudFctControllerTest {

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

  @Autowired
  private AsignacionFctRepository asignacionFctRepository;

  @Autowired
  private NotificacionRepository notificacionRepository;

  @Autowired
  private org.springframework.transaction.support.TransactionTemplate transactionTemplate;

  private Long publishedOfferId;
  private Long draftOfferId;

  @BeforeEach
  void setUp() {
    asignacionFctRepository.deleteAll();
    notificacionRepository.deleteAll();
    solicitudFctRepository.deleteAll();
    ofertaFctRepository.deleteAll();
    userAccountRepository.deleteAll();
    empresaRepository.deleteAll();

    userAccountRepository.save(new UserAccount(
        "alumno@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Alumno Demo",
        Set.of(UserRole.ALUMNO)));

    Empresa company = empresaRepository.save(new Empresa(
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

    userAccountRepository.save(new UserAccount(
        "empresa@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Empresa Demo",
        Set.of(UserRole.EMPRESA),
        company.getId()));

    publishedOfferId = ofertaFctRepository.save(new OfertaFct(
            company,
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

    draftOfferId = ofertaFctRepository.save(new OfertaFct(
            company,
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
  void requestOfferRequiresAuthentication() throws Exception {
    mockMvc.perform(post("/api/ofertas/{id}/solicitudes", publishedOfferId))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void alumnoCanRequestPublishedOffer() throws Exception {
    mockMvc.perform(post("/api/ofertas/{id}/solicitudes", publishedOfferId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno@example.com")))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.ofertaId").value(publishedOfferId))
        .andExpect(jsonPath("$.ofertaTitulo").value("Practicas de analisis de datos"))
        .andExpect(jsonPath("$.empresaNombre").value("Tech Norte Formacion"))
        .andExpect(jsonPath("$.estado").value("SOLICITADA"));
  }

  @Test
  void requestOfferNotifiesCompanyUsers() throws Exception {
    mockMvc.perform(post("/api/ofertas/{id}/solicitudes", publishedOfferId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno@example.com")))
        .andExpect(status().isCreated());

    mockMvc.perform(get("/api/notificaciones/me")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].tipo").value("SOLICITUD_RECIBIDA"))
        .andExpect(jsonPath("$[0].titulo").value("Nueva solicitud recibida"))
        .andExpect(jsonPath("$[0].leida").value(false));
  }

  @Test
  void mineReturnsAuthenticatedAlumnoApplications() throws Exception {
    mockMvc.perform(post("/api/ofertas/{id}/solicitudes", publishedOfferId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno@example.com")))
        .andExpect(status().isCreated());

    mockMvc.perform(get("/api/solicitudes/me")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].ofertaId").value(publishedOfferId))
        .andExpect(jsonPath("$[0].estado").value("SOLICITADA"))
        .andExpect(jsonPath("$[0].asignadaPorCentro").value(false))
        .andExpect(jsonPath("$[0].fechaAsignacion").doesNotExist());
  }

  @Test
  void mineMarksAsignadaPorCentroWhenAssigned() throws Exception {
    mockMvc.perform(post("/api/ofertas/{id}/solicitudes", publishedOfferId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno@example.com")))
        .andExpect(status().isCreated());

    Long solicitudId = solicitudFctRepository.findAll().getFirst().getId();
    transactionTemplate.executeWithoutResult(status -> {
      SolicitudFct managed = solicitudFctRepository.findById(solicitudId).orElseThrow();
      managed.changeEstado(SolicitudEstado.ACEPTADA);
      asignacionFctRepository.save(new AsignacionFct(managed, "Asignada por el centro"));
    });

    mockMvc.perform(get("/api/solicitudes/me")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].estado").value("ACEPTADA"))
        .andExpect(jsonPath("$[0].asignadaPorCentro").value(true))
        .andExpect(jsonPath("$[0].fechaAsignacion").exists());
  }

  @Test
  void requestOfferRejectsDuplicates() throws Exception {
    String token = accessToken("alumno@example.com");

    mockMvc.perform(post("/api/ofertas/{id}/solicitudes", publishedOfferId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andExpect(status().isCreated());

    mockMvc.perform(post("/api/ofertas/{id}/solicitudes", publishedOfferId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andExpect(status().isConflict());
  }

  @Test
  void requestOfferDoesNotExposeDraftOffer() throws Exception {
    mockMvc.perform(post("/api/ofertas/{id}/solicitudes", draftOfferId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno@example.com")))
        .andExpect(status().isNotFound());
  }

  @Test
  void requestOfferRequiresAlumnoRole() throws Exception {
    mockMvc.perform(post("/api/ofertas/{id}/solicitudes", publishedOfferId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa@example.com")))
        .andExpect(status().isForbidden());
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
