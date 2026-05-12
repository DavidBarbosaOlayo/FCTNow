package com.fctnow.backend.asignaciones.externas;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fctnow.backend.asignaciones.AsignacionFctRepository;
import com.fctnow.backend.auth.LoginRequest;
import com.fctnow.backend.solicitudes.externas.SolicitudExternaRepository;
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
class AsignacionFctExternaControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Autowired
  private PasswordEncoder passwordEncoder;

  @Autowired
  private UserAccountRepository userAccountRepository;

  @Autowired
  private SolicitudExternaRepository solicitudExternaRepository;

  @Autowired
  private AsignacionFctExternaRepository asignacionRepository;

  @Autowired
  private AsignacionFctRepository asignacionFctRepository;

  @BeforeEach
  void setUp() {
    asignacionRepository.deleteAll();
    asignacionFctRepository.deleteAll();
    solicitudExternaRepository.deleteAll();
    userAccountRepository.deleteAll();
    userAccountRepository.save(new UserAccount(
        "alumno@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Alumno Demo",
        Set.of(UserRole.ALUMNO)));
    userAccountRepository.save(new UserAccount(
        "tutor@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Tutor Demo",
        Set.of(UserRole.TUTOR_CENTRO)));
  }

  @Test
  void candidatasRequireCentroRole() throws Exception {
    mockMvc.perform(get("/api/asignaciones/externas/candidatas"))
        .andExpect(status().isUnauthorized());

    String alumnoToken = loginAs("alumno@example.com");
    mockMvc.perform(get("/api/asignaciones/externas/candidatas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + alumnoToken))
        .andExpect(status().isForbidden());
  }

  @Test
  void candidatasReturnsAceptadasSinAsignacion() throws Exception {
    String alumnoToken = loginAs("alumno@example.com");
    Long solicitudId = createAndAccept(alumnoToken, "ext-9", "Becario backend");

    String tutorToken = loginAs("tutor@example.com");

    mockMvc.perform(get("/api/asignaciones/externas/candidatas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + tutorToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].solicitudExternaId").value(solicitudId))
        .andExpect(jsonPath("$[0].titulo").value("Becario backend"));
  }

  @Test
  void createPersistsAssignmentAndRemovesCandidate() throws Exception {
    String alumnoToken = loginAs("alumno@example.com");
    Long solicitudId = createAndAccept(alumnoToken, "ext-9", "Becario backend");

    String tutorToken = loginAs("tutor@example.com");
    String body = "{\"solicitudExternaId\":" + solicitudId + ",\"observaciones\":\"FCT confirmada\"}";

    mockMvc.perform(post("/api/asignaciones/externas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + tutorToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(body))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.solicitudExternaId").value(solicitudId))
        .andExpect(jsonPath("$.estado").value("ACTIVA"))
        .andExpect(jsonPath("$.titulo").value("Becario backend"));

    mockMvc.perform(post("/api/asignaciones/externas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + tutorToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(body))
        .andExpect(status().isConflict());

    Long segundaSolicitudId = createAndAccept(alumnoToken, "ext-10", "Becario datos");
    mockMvc.perform(post("/api/asignaciones/externas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + tutorToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"solicitudExternaId\":" + segundaSolicitudId + "}"))
        .andExpect(status().isConflict());

    mockMvc.perform(get("/api/asignaciones/externas/candidatas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + tutorToken))
        .andExpect(jsonPath("$.length()").value(0));

    mockMvc.perform(get("/api/asignaciones/externas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + tutorToken))
        .andExpect(jsonPath("$.length()").value(1));
  }

  @Test
  void assignedExternalSolicitudCannotBeWithdrawnByAlumno() throws Exception {
    String alumnoToken = loginAs("alumno@example.com");
    Long solicitudId = createAndAccept(alumnoToken, "ext-9", "Becario backend");

    String tutorToken = loginAs("tutor@example.com");
    mockMvc.perform(post("/api/asignaciones/externas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + tutorToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"solicitudExternaId\":" + solicitudId + "}"))
        .andExpect(status().isCreated());

    mockMvc.perform(patch("/api/alumno/solicitudes-externas/{id}/estado", solicitudId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + alumnoToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"estado\":\"RETIRADA\"}"))
        .andExpect(status().isConflict());
  }

  @Test
  void rejectsAssignmentForNonAceptadaSolicitud() throws Exception {
    String alumnoToken = loginAs("alumno@example.com");

    String createResponse = mockMvc.perform(post("/api/alumno/solicitudes-externas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + alumnoToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(samplePayload("ext-9", "Becario backend")))
        .andExpect(status().isCreated())
        .andReturn().getResponse().getContentAsString();
    Long id = objectMapper.readTree(createResponse).get("id").asLong();

    String tutorToken = loginAs("tutor@example.com");
    String body = "{\"solicitudExternaId\":" + id + "}";

    mockMvc.perform(post("/api/asignaciones/externas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + tutorToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(body))
        .andExpect(status().isConflict());
  }

  private Long createAndAccept(String alumnoToken, String idExterno, String titulo) throws Exception {
    String createResponse = mockMvc.perform(post("/api/alumno/solicitudes-externas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + alumnoToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(samplePayload(idExterno, titulo)))
        .andExpect(status().isCreated())
        .andReturn().getResponse().getContentAsString();
    Long id = objectMapper.readTree(createResponse).get("id").asLong();

    mockMvc.perform(patch("/api/alumno/solicitudes-externas/{id}/estado", id)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + alumnoToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"estado\":\"ACEPTADA\"}"))
        .andExpect(status().isOk());
    return id;
  }

  private String samplePayload(String idExterno, String titulo) {
    return "{"
        + "\"fuente\":\"ADZUNA\","
        + "\"idExterno\":\"" + idExterno + "\","
        + "\"titulo\":\"" + titulo + "\","
        + "\"empresaNombre\":\"Tech Iberia\","
        + "\"localidad\":\"Valencia\","
        + "\"urlAplicacion\":\"https://www.adzuna.es/land/ad/" + idExterno + "\""
        + "}";
  }

  private String loginAs(String email) throws Exception {
    String response = mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(new LoginRequest(email, "CorrectPassword123!"))))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();
    return objectMapper.readTree(response).get("accessToken").asText();
  }
}
