package com.fctnow.backend.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fctnow.backend.asignaciones.AsignacionFctRepository;
import com.fctnow.backend.asignaciones.externas.AsignacionFctExternaRepository;
import com.fctnow.backend.solicitudes.SolicitudFctRepository;
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
class AuthControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Autowired
  private PasswordEncoder passwordEncoder;

  @Autowired
  private UserAccountRepository userAccountRepository;

  @Autowired
  private AsignacionFctRepository asignacionFctRepository;

  @Autowired
  private AsignacionFctExternaRepository asignacionFctExternaRepository;

  @Autowired
  private SolicitudFctRepository solicitudFctRepository;

  @Autowired
  private SolicitudExternaRepository solicitudExternaRepository;

  @BeforeEach
  void setUp() {
    asignacionFctRepository.deleteAll();
    asignacionFctExternaRepository.deleteAll();
    solicitudFctRepository.deleteAll();
    solicitudExternaRepository.deleteAll();
    userAccountRepository.deleteAll();
    userAccountRepository.save(new UserAccount(
        "alumno@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Alumno Demo",
        Set.of(UserRole.ALUMNO)));
  }

  @Test
  void loginReturnsJwtForValidCredentials() throws Exception {
    mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(
                new LoginRequest("alumno@example.com", "CorrectPassword123!"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.tokenType").value("Bearer"))
        .andExpect(jsonPath("$.accessToken").isString())
        .andExpect(jsonPath("$.expiresAt").isString())
        .andExpect(jsonPath("$.user.email").value("alumno@example.com"))
        .andExpect(jsonPath("$.user.displayName").value("Alumno Demo"))
        .andExpect(jsonPath("$.user.roles[0]").value("ALUMNO"));
  }

  @Test
  void loginRejectsInvalidCredentials() throws Exception {
    mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(
                new LoginRequest("alumno@example.com", "wrong-password"))))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("AUTHENTICATION_FAILED"));
  }

  @Test
  void protectedEndpointRejectsMissingToken() throws Exception {
    mockMvc.perform(get("/api/auth/me"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
  }

  @Test
  void meReturnsAuthenticatedUserForValidToken() throws Exception {
    String loginResponse = mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(
                new LoginRequest("alumno@example.com", "CorrectPassword123!"))))
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString();
    String accessToken = objectMapper.readTree(loginResponse).get("accessToken").asText();

    mockMvc.perform(get("/api/auth/me")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email").value("alumno@example.com"))
        .andExpect(jsonPath("$.displayName").value("Alumno Demo"))
        .andExpect(jsonPath("$.roles[0]").value("ALUMNO"));
  }

  @Test
  void healthAndOpenApiRemainPublic() throws Exception {
    mockMvc.perform(get("/api/health"))
        .andExpect(status().isOk());

    mockMvc.perform(get("/api/openapi"))
        .andExpect(status().isOk())
        .andExpect(header().string(HttpHeaders.CONTENT_TYPE, "application/json"));
  }
}
