package com.fctnow.backend.solicitudes;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fctnow.backend.asignaciones.AsignacionFctRepository;
import com.fctnow.backend.asignaciones.externas.AsignacionFctExternaRepository;
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
import com.fctnow.backend.solicitudes.externas.SolicitudExternaRepository;
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
class EmpresaSolicitudControllerTest {

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
  private SolicitudExternaRepository solicitudExternaRepository;

  @Autowired
  private AsignacionFctRepository asignacionFctRepository;

  @Autowired
  private AsignacionFctExternaRepository asignacionFctExternaRepository;

  @Autowired
  private NotificacionRepository notificacionRepository;

  private Long ofertaEmpresaAId;
  private Long solicitudEmpresaAFromAlumnoAId;
  private Long solicitudEmpresaBId;

  @BeforeEach
  void setUp() {
    asignacionFctRepository.deleteAll();
    asignacionFctExternaRepository.deleteAll();
    notificacionRepository.deleteAll();
    solicitudFctRepository.deleteAll();
    solicitudExternaRepository.deleteAll();
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
    Long empresaAId = empresaA.getId();

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
    Long empresaBId = empresaB.getId();

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
        "tutor@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Tutor Centro",
        Set.of(UserRole.TUTOR_CENTRO)));

    UserAccount alumnoA = userAccountRepository.save(new UserAccount(
        "alumno-a@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Alumno Demo A",
        Set.of(UserRole.ALUMNO)));

    UserAccount alumnoB = userAccountRepository.save(new UserAccount(
        "alumno-b@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Alumno Demo B",
        Set.of(UserRole.ALUMNO)));

    OfertaFct ofertaA = ofertaFctRepository.save(new OfertaFct(
        empresaA,
        "Publicada empresa A",
        "Descripcion publicada.",
        "Informatica y comunicaciones",
        "Desarrollo de Aplicaciones Web",
        "Valencia",
        "Valencia",
        OfertaModalidad.PRESENCIAL,
        LocalDate.of(2026, 9, 15),
        LocalDate.of(2026, 12, 15),
        2,
        null,
        "Tareas variadas.",
        OfertaEstado.PUBLICADA));
    ofertaEmpresaAId = ofertaA.getId();

    OfertaFct ofertaB = ofertaFctRepository.save(new OfertaFct(
        empresaB,
        "Publicada empresa B",
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
        OfertaEstado.PUBLICADA));

    solicitudEmpresaAFromAlumnoAId = solicitudFctRepository.save(new SolicitudFct(alumnoA, ofertaA))
        .getId();
    solicitudFctRepository.save(new SolicitudFct(alumnoB, ofertaA));
    solicitudEmpresaBId = solicitudFctRepository.save(new SolicitudFct(alumnoA, ofertaB)).getId();
  }

  @Test
  void listMineRequiresAuthentication() throws Exception {
    mockMvc.perform(get("/api/empresas/me/solicitudes"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void listMineReturnsOnlyOwnSolicitudes() throws Exception {
    mockMvc.perform(get("/api/empresas/me/solicitudes")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa-a@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(2))
        .andExpect(jsonPath("$[0].oferta.id").value(ofertaEmpresaAId.intValue()))
        .andExpect(jsonPath("$[1].oferta.id").value(ofertaEmpresaAId.intValue()));
  }

  @Test
  void listMineExposesAlumnoData() throws Exception {
    mockMvc.perform(get("/api/empresas/me/solicitudes")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa-a@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].alumno.email").exists())
        .andExpect(jsonPath("$[0].alumno.displayName").exists())
        .andExpect(jsonPath("$[0].estado").value("SOLICITADA"));
  }

  @Test
  void listMineRejectsAlumno() throws Exception {
    mockMvc.perform(get("/api/empresas/me/solicitudes")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno-a@example.com")))
        .andExpect(status().isForbidden());
  }

  @Test
  void listMineRejectsEmpresaWithoutEmpresaId() throws Exception {
    mockMvc.perform(get("/api/empresas/me/solicitudes")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa-sin-empresa@example.com")))
        .andExpect(status().isForbidden());
  }

  @Test
  void changeEstadoAceptaSolicitud() throws Exception {
    mockMvc.perform(patch("/api/empresas/me/solicitudes/{id}/estado", solicitudEmpresaAFromAlumnoAId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa-a@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"estado\":\"ACEPTADA\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("ACEPTADA"));
  }

  @Test
  void changeEstadoAceptadaNotifiesAlumnoAndTutor() throws Exception {
    mockMvc.perform(patch("/api/empresas/me/solicitudes/{id}/estado", solicitudEmpresaAFromAlumnoAId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa-a@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"estado\":\"ACEPTADA\"}"))
        .andExpect(status().isOk());

    mockMvc.perform(get("/api/notificaciones/me")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno-a@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].tipo").value("SOLICITUD_ACEPTADA"))
        .andExpect(jsonPath("$[0].leida").value(false));

    mockMvc.perform(get("/api/notificaciones/me")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("tutor@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].tipo").value("SOLICITUD_ACEPTADA_PENDIENTE_ASIGNACION"))
        .andExpect(jsonPath("$[0].actionUrl").value("/asignaciones"));
  }

  @Test
  void changeEstadoRechazadaNotifiesAlumnoOnly() throws Exception {
    mockMvc.perform(patch("/api/empresas/me/solicitudes/{id}/estado", solicitudEmpresaAFromAlumnoAId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa-a@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"estado\":\"RECHAZADA\"}"))
        .andExpect(status().isOk());

    mockMvc.perform(get("/api/notificaciones/me")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno-a@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].tipo").value("SOLICITUD_RECHAZADA"));

    mockMvc.perform(get("/api/notificaciones/me")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("tutor@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(0));
  }

  @Test
  void changeEstadoRechazaSolicitud() throws Exception {
    mockMvc.perform(patch("/api/empresas/me/solicitudes/{id}/estado", solicitudEmpresaAFromAlumnoAId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa-a@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"estado\":\"RECHAZADA\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("RECHAZADA"));
  }

  @Test
  void changeEstadoRejectsTransitionFromAceptada() throws Exception {
    mockMvc.perform(patch("/api/empresas/me/solicitudes/{id}/estado", solicitudEmpresaAFromAlumnoAId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa-a@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"estado\":\"ACEPTADA\"}"))
        .andExpect(status().isOk());

    mockMvc.perform(patch("/api/empresas/me/solicitudes/{id}/estado", solicitudEmpresaAFromAlumnoAId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa-a@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"estado\":\"RECHAZADA\"}"))
        .andExpect(status().isConflict());
  }

  @Test
  void changeEstadoRejectsBackToSolicitada() throws Exception {
    mockMvc.perform(patch("/api/empresas/me/solicitudes/{id}/estado", solicitudEmpresaAFromAlumnoAId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa-a@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"estado\":\"RECHAZADA\"}"))
        .andExpect(status().isOk());

    mockMvc.perform(patch("/api/empresas/me/solicitudes/{id}/estado", solicitudEmpresaAFromAlumnoAId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa-a@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"estado\":\"SOLICITADA\"}"))
        .andExpect(status().isConflict());
  }

  @Test
  void changeEstadoOfOtherCompanyIsNotFound() throws Exception {
    mockMvc.perform(patch("/api/empresas/me/solicitudes/{id}/estado", solicitudEmpresaBId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa-a@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"estado\":\"ACEPTADA\"}"))
        .andExpect(status().isNotFound());
  }

  @Test
  void changeEstadoRejectsAlumno() throws Exception {
    mockMvc.perform(patch("/api/empresas/me/solicitudes/{id}/estado", solicitudEmpresaAFromAlumnoAId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno-a@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"estado\":\"ACEPTADA\"}"))
        .andExpect(status().isForbidden());
  }

  @Test
  void changeEstadoRejectsEmpresaWithoutEmpresaId() throws Exception {
    mockMvc.perform(patch("/api/empresas/me/solicitudes/{id}/estado", solicitudEmpresaAFromAlumnoAId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa-sin-empresa@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"estado\":\"ACEPTADA\"}"))
        .andExpect(status().isForbidden());
  }

  @Test
  void changeEstadoRequiresEstado() throws Exception {
    mockMvc.perform(patch("/api/empresas/me/solicitudes/{id}/estado", solicitudEmpresaAFromAlumnoAId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa-a@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{}"))
        .andExpect(status().isBadRequest());
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
