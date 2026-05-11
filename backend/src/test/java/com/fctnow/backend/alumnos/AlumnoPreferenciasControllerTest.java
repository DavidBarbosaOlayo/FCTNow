package com.fctnow.backend.alumnos;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fctnow.backend.auth.LoginRequest;
import com.fctnow.backend.user.UserAccount;
import com.fctnow.backend.user.UserAccountRepository;
import com.fctnow.backend.user.UserRole;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AlumnoPreferenciasControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Autowired
  private PasswordEncoder passwordEncoder;

  @Autowired
  private UserAccountRepository userAccountRepository;

  @Autowired
  private AlumnoPreferenciasRepository alumnoPreferenciasRepository;

  @BeforeEach
  void setUp() {
    alumnoPreferenciasRepository.deleteAll();
    userAccountRepository.deleteAll();

    userAccountRepository.save(new UserAccount(
        "alumno@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Alumno Demo",
        Set.of(UserRole.ALUMNO)));

    userAccountRepository.save(new UserAccount(
        "empresa@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Empresa Demo",
        Set.of(UserRole.EMPRESA)));
  }

  @Test
  void preferencesRequireAuthentication() throws Exception {
    mockMvc.perform(get("/api/alumnos/me/preferencias"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void alumnoGetsEmptyPreferencesWhenNotCreatedYet() throws Exception {
    mockMvc.perform(get("/api/alumnos/me/preferencias")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.familiaProfesional").doesNotExist())
        .andExpect(jsonPath("$.hasCv").value(false))
        .andExpect(jsonPath("$.hasPhoto").value(false));
  }

  @Test
  void alumnoCanSavePreferences() throws Exception {
    mockMvc.perform(put("/api/alumnos/me/preferencias")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(validRequest())))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.familiaProfesional").value("Informatica y comunicaciones"))
        .andExpect(jsonPath("$.cicloFormativo").value("Desarrollo de Aplicaciones Web"))
        .andExpect(jsonPath("$.localidadPreferida").value("Valencia"))
        .andExpect(jsonPath("$.modalidadPreferida").value("HIBRIDA"))
        .andExpect(jsonPath("$.fechaDisponibilidad").value("2026-09-15"))
        .andExpect(jsonPath("$.hasCv").value(false))
        .andExpect(jsonPath("$.hasPhoto").value(false));
  }

  @Test
  void preferencesRejectNonAlumnoRole() throws Exception {
    mockMvc.perform(get("/api/alumnos/me/preferencias")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa@example.com")))
        .andExpect(status().isForbidden());
  }

  @Test
  void alumnoCanUploadAndDownloadCv() throws Exception {
    MockMultipartFile cv = new MockMultipartFile(
        "file",
        "cv-alumno.pdf",
        "application/pdf",
        "%PDF-1.4 demo".getBytes());

    mockMvc.perform(multipartPut("/api/alumnos/me/cv")
            .file(cv)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.hasCv").value(true))
        .andExpect(jsonPath("$.cvFileName").value("cv-alumno.pdf"))
        .andExpect(jsonPath("$.cvContentType").value("application/pdf"));

    mockMvc.perform(get("/api/alumnos/me/cv")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno@example.com")))
        .andExpect(status().isOk())
        .andExpect(header().string(HttpHeaders.CONTENT_TYPE, "application/pdf"))
        .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"cv-alumno.pdf\""));
  }

  @Test
  void uploadCvRejectsNonPdfFiles() throws Exception {
    MockMultipartFile cv = new MockMultipartFile(
        "file",
        "cv-alumno.txt",
        "text/plain",
        "no pdf".getBytes());

    mockMvc.perform(multipartPut("/api/alumnos/me/cv")
            .file(cv)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno@example.com")))
        .andExpect(status().isBadRequest());
  }

  @Test
  void alumnoCanUploadPhoto() throws Exception {
    MockMultipartFile photo = new MockMultipartFile(
        "file",
        "foto-alumno.png",
        "image/png",
        "png-demo".getBytes());

    mockMvc.perform(multipartPut("/api/alumnos/me/foto")
            .file(photo)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.hasPhoto").value(true))
        .andExpect(jsonPath("$.photoContentType").value("image/png"))
        .andExpect(jsonPath("$.photoDataUrl").value("data:image/png;base64,cG5nLWRlbW8="));
  }

  @Test
  void uploadPhotoRejectsNonImageFiles() throws Exception {
    MockMultipartFile photo = new MockMultipartFile(
        "file",
        "foto-alumno.txt",
        "text/plain",
        "no image".getBytes());

    mockMvc.perform(multipartPut("/api/alumnos/me/foto")
            .file(photo)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno@example.com")))
        .andExpect(status().isBadRequest());
  }

  @Test
  void cvDownloadReturnsNotFoundWhenMissing() throws Exception {
    mockMvc.perform(get("/api/alumnos/me/cv")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno@example.com")))
        .andExpect(status().isNotFound());
  }

  private Map<String, Object> validRequest() {
    return Map.of(
        "familiaProfesional", "Informatica y comunicaciones",
        "cicloFormativo", "Desarrollo de Aplicaciones Web",
        "localidadPreferida", "Valencia",
        "modalidadPreferida", "HIBRIDA",
        "fechaDisponibilidad", "2026-09-15",
        "observaciones", "Preferencia por equipos de desarrollo web.");
  }

  private MockMultipartHttpServletRequestBuilder multipartPut(String url) {
    MockMultipartHttpServletRequestBuilder builder = multipart(url);
    builder.with(request -> {
      request.setMethod("PUT");
      return request;
    });
    return builder;
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
