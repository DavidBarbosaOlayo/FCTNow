package com.fctnow.backend.solicitudes.externas;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fctnow.backend.auth.LoginRequest;
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
class SolicitudExternaControllerTest {

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

  @BeforeEach
  void setUp() {
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
  void requiresAuthentication() throws Exception {
    mockMvc.perform(get("/api/alumno/solicitudes-externas"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void rejectsNonAlumno() throws Exception {
    mockMvc.perform(get("/api/alumno/solicitudes-externas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + loginAs("tutor@example.com")))
        .andExpect(status().isForbidden());
  }

  @Test
  void createsAndListsAlumnoOwnSolicitudes() throws Exception {
    String token = loginAs("alumno@example.com");

    mockMvc.perform(post("/api/alumno/solicitudes-externas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(samplePayload("ext-1", "Becario backend")))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.titulo").value("Becario backend"))
        .andExpect(jsonPath("$.estado").value("SOLICITADA"))
        .andExpect(jsonPath("$.fuente").value("ADZUNA"));

    mockMvc.perform(get("/api/alumno/solicitudes-externas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].idExterno").value("ext-1"));
  }

  @Test
  void rejectsDuplicateActiveSolicitud() throws Exception {
    String token = loginAs("alumno@example.com");

    mockMvc.perform(post("/api/alumno/solicitudes-externas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(samplePayload("ext-1", "Becario backend")))
        .andExpect(status().isCreated());

    mockMvc.perform(post("/api/alumno/solicitudes-externas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(samplePayload("ext-1", "Becario backend (otra vez)")))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.estado").value("SOLICITADA"));

    mockMvc.perform(get("/api/alumno/solicitudes-externas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andExpect(jsonPath("$.length()").value(1));
  }

  @Test
  void allowsTransitionFromSolicitadaToAceptada() throws Exception {
    String token = loginAs("alumno@example.com");

    String createResponse = mockMvc.perform(post("/api/alumno/solicitudes-externas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(samplePayload("ext-9", "QA Becario")))
        .andExpect(status().isCreated())
        .andReturn().getResponse().getContentAsString();

    Long id = objectMapper.readTree(createResponse).get("id").asLong();

    mockMvc.perform(patch("/api/alumno/solicitudes-externas/{id}/estado", id)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"estado\":\"ACEPTADA\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("ACEPTADA"));
  }

  @Test
  void rejectsInvalidTransition() throws Exception {
    String token = loginAs("alumno@example.com");

    String createResponse = mockMvc.perform(post("/api/alumno/solicitudes-externas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(samplePayload("ext-9", "QA Becario")))
        .andExpect(status().isCreated())
        .andReturn().getResponse().getContentAsString();

    Long id = objectMapper.readTree(createResponse).get("id").asLong();

    mockMvc.perform(patch("/api/alumno/solicitudes-externas/{id}/estado", id)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"estado\":\"RETIRADA\"}"))
        .andExpect(status().isOk());

    mockMvc.perform(patch("/api/alumno/solicitudes-externas/{id}/estado", id)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"estado\":\"ACEPTADA\"}"))
        .andExpect(status().isConflict());
  }

  @Test
  void reactivatesRetiradaWhenSameOfferIsRequestedAgain() throws Exception {
    String token = loginAs("alumno@example.com");

    String createResponse = mockMvc.perform(post("/api/alumno/solicitudes-externas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(samplePayload("ext-1", "Becario backend")))
        .andExpect(status().isCreated())
        .andReturn().getResponse().getContentAsString();
    Long id = objectMapper.readTree(createResponse).get("id").asLong();

    mockMvc.perform(patch("/api/alumno/solicitudes-externas/{id}/estado", id)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"estado\":\"RETIRADA\"}"))
        .andExpect(status().isOk());

    mockMvc.perform(post("/api/alumno/solicitudes-externas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(samplePayload("ext-1", "Becario backend (reactivada)")))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").value(id))
        .andExpect(jsonPath("$.estado").value("SOLICITADA"))
        .andExpect(jsonPath("$.titulo").value("Becario backend (reactivada)"));
  }

  @Test
  void deletesRetiradaSolicitud() throws Exception {
    String token = loginAs("alumno@example.com");

    String createResponse = mockMvc.perform(post("/api/alumno/solicitudes-externas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(samplePayload("ext-delete", "QA Becario")))
        .andExpect(status().isCreated())
        .andReturn().getResponse().getContentAsString();
    Long id = objectMapper.readTree(createResponse).get("id").asLong();

    mockMvc.perform(patch("/api/alumno/solicitudes-externas/{id}/estado", id)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"estado\":\"RETIRADA\"}"))
        .andExpect(status().isOk());

    mockMvc.perform(delete("/api/alumno/solicitudes-externas/{id}", id)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andExpect(status().isNoContent());

    mockMvc.perform(get("/api/alumno/solicitudes-externas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(0));
  }

  private String samplePayload(String idExterno, String titulo) {
    return "{"
        + "\"fuente\":\"ADZUNA\","
        + "\"idExterno\":\"" + idExterno + "\","
        + "\"titulo\":\"" + titulo + "\","
        + "\"empresaNombre\":\"Tech Iberia\","
        + "\"localidad\":\"Valencia\","
        + "\"region\":\"Comunidad Valenciana\","
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
