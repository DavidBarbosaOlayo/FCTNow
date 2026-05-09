package com.fctnow.backend.ofertas.externas;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fctnow.backend.auth.LoginRequest;
import com.fctnow.backend.user.UserAccount;
import com.fctnow.backend.user.UserAccountRepository;
import com.fctnow.backend.user.UserRole;
import java.time.Instant;
import java.util.List;
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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OfertaExternaControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Autowired
  private PasswordEncoder passwordEncoder;

  @Autowired
  private UserAccountRepository userAccountRepository;

  @MockitoBean
  private AdzunaService adzunaService;

  @BeforeEach
  void setUp() {
    userAccountRepository.deleteAll();
    userAccountRepository.save(new UserAccount(
        "alumno@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Alumno Demo",
        Set.of(UserRole.ALUMNO)));
  }

  @Test
  void listRequiresAuthentication() throws Exception {
    mockMvc.perform(get("/api/ofertas/externas"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void listReturnsMappedExternalOffers() throws Exception {
    OfertaExternaResponse offer = new OfertaExternaResponse(
        "ad-9",
        "ADZUNA",
        "Becario QA",
        "Logística Levante",
        "Castellón",
        "Comunidad Valenciana",
        "Apoyo en pruebas funcionales",
        "TI",
        "permanent",
        "full_time",
        15000.0,
        20000.0,
        Boolean.FALSE,
        Instant.parse("2026-04-12T08:00:00Z"),
        "https://www.adzuna.es/land/ad/9");
    when(adzunaService.search(any(), any(), any(), any(), any()))
        .thenReturn(new OfertaExternaPageResponse(
            List.of(offer),
            1,
            20,
            42L,
            "Resultados ofrecidos por Adzuna",
            "https://www.adzuna.es/"));

    mockMvc.perform(get("/api/ofertas/externas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.results.length()").value(1))
        .andExpect(jsonPath("$.results[0].id").value("ad-9"))
        .andExpect(jsonPath("$.results[0].fuente").value("ADZUNA"))
        .andExpect(jsonPath("$.results[0].empresaNombre").value("Logística Levante"))
        .andExpect(jsonPath("$.results[0].urlAplicacion").value("https://www.adzuna.es/land/ad/9"))
        .andExpect(jsonPath("$.totalResults").value(42))
        .andExpect(jsonPath("$.attribution").value("Resultados ofrecidos por Adzuna"))
        .andExpect(jsonPath("$.attributionUrl").value("https://www.adzuna.es/"));
  }

  @Test
  void forwardsFilterParametersIncludingCategory() throws Exception {
    when(adzunaService.search(any(), any(), any(), any(), any()))
        .thenReturn(new OfertaExternaPageResponse(
            java.util.List.of(),
            1,
            20,
            0L,
            "Resultados ofrecidos por Adzuna",
            "https://www.adzuna.es/"));

    mockMvc.perform(get("/api/ofertas/externas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken())
            .param("q", "java")
            .param("where", "Valencia")
            .param("category", "it-jobs")
            .param("resultsPerPage", "10"))
        .andExpect(status().isOk());

    verify(adzunaService).search(eq("java"), eq("Valencia"), eq("it-jobs"), eq(null), eq(10));
  }

  @Test
  void returnsServiceUnavailableWhenAdzunaIsDown() throws Exception {
    when(adzunaService.search(any(), any(), any(), any(), any()))
        .thenThrow(new AdzunaUnavailableException("Adzuna is not reachable"));

    mockMvc.perform(get("/api/ofertas/externas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken()))
        .andExpect(status().isServiceUnavailable());
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
