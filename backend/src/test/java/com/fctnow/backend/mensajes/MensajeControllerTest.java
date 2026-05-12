package com.fctnow.backend.mensajes;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fctnow.backend.alumnos.AlumnoPreferencias;
import com.fctnow.backend.alumnos.AlumnoPreferenciasRepository;
import com.fctnow.backend.auth.LoginRequest;
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
class MensajeControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Autowired
  private PasswordEncoder passwordEncoder;

  @Autowired
  private UserAccountRepository userAccountRepository;

  @Autowired
  private ConversacionRepository conversacionRepository;

  @Autowired
  private MensajeRepository mensajeRepository;

  @Autowired
  private AlumnoPreferenciasRepository preferenciasRepository;

  private Long conversacionId;
  private Long alumnoCompatibleId;
  private Long tutorId;
  private Long profesorId;

  @BeforeEach
  void setUp() {
    mensajeRepository.deleteAll();
    conversacionRepository.deleteAll();
    preferenciasRepository.deleteAll();
    userAccountRepository.deleteAll();

    UserAccount alumno = userAccountRepository.save(new UserAccount(
        "alumno@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Alumno Demo",
        Set.of(UserRole.ALUMNO)));
    UserAccount empresa = userAccountRepository.save(new UserAccount(
        "empresa@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Empresa Demo",
        Set.of(UserRole.EMPRESA)));
    UserAccount tutor = userAccountRepository.save(new UserAccount(
        "tutor@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Tutor Demo",
        Set.of(UserRole.TUTOR_CENTRO)));
    tutorId = tutor.getId();
    UserAccount profesor = userAccountRepository.save(new UserAccount(
        "profesor@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Profesor Demo",
        Set.of(UserRole.TUTOR_CENTRO)));
    profesorId = profesor.getId();
    UserAccount alumnoCompatible = userAccountRepository.save(new UserAccount(
        "alumno-compatible@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Ana Compatible",
        Set.of(UserRole.ALUMNO)));
    alumnoCompatibleId = alumnoCompatible.getId();
    UserAccount alumnoOtraFamilia = userAccountRepository.save(new UserAccount(
        "alumno-otra@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Alumno Otra Familia",
        Set.of(UserRole.ALUMNO)));

    savePreferences(alumno, "Informatica y comunicaciones");
    savePreferences(alumnoCompatible, "Informatica y comunicaciones");
    savePreferences(alumnoOtraFamilia, "Administracion y gestion");

    Conversacion conversacion = conversacionRepository.save(new Conversacion(
        null,
        alumno,
        empresa));
    conversacionId = conversacion.getId();
    mensajeRepository.save(new Mensaje(conversacion, empresa, "Hola, revisamos tu solicitud."));

    Conversacion otraConversacion = conversacionRepository.save(new Conversacion(
        null,
        empresa,
        tutor));
    mensajeRepository.save(new Mensaje(otraConversacion, tutor, "Mensaje privado del tutor."));
  }

  @Test
  void searchesCompatibleContactsByProfessionalFamilyAndName() throws Exception {
    mockMvc.perform(get("/api/mensajes/contactos")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(3))
        .andExpect(jsonPath("$[0].id").value(alumnoCompatibleId))
        .andExpect(jsonPath("$[0].displayName").value("Ana Compatible"))
        .andExpect(jsonPath("$[0].familiaProfesional").value("Informatica y comunicaciones"))
        .andExpect(jsonPath("$[1].id").value(profesorId))
        .andExpect(jsonPath("$[1].displayName").value("Profesor Demo"))
        .andExpect(jsonPath("$[1].familiaProfesional").doesNotExist())
        .andExpect(jsonPath("$[2].id").value(tutorId))
        .andExpect(jsonPath("$[2].displayName").value("Tutor Demo"));

    mockMvc.perform(get("/api/mensajes/contactos")
            .param("nombre", "otra")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(0));

    mockMvc.perform(get("/api/mensajes/contactos")
            .param("nombre", "tutor")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].id").value(tutorId))
        .andExpect(jsonPath("$[0].displayName").value("Tutor Demo"));
  }

  @Test
  void searchesStudentAndTeacherContactsForTeacher() throws Exception {
    mockMvc.perform(get("/api/mensajes/contactos")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("tutor@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(4))
        .andExpect(jsonPath("$[0].displayName").value("Alumno Demo"))
        .andExpect(jsonPath("$[1].displayName").value("Alumno Otra Familia"))
        .andExpect(jsonPath("$[2].displayName").value("Ana Compatible"))
        .andExpect(jsonPath("$[3].displayName").value("Profesor Demo"));
  }

  @Test
  void createsOrReusesConversationWithCompatibleContact() throws Exception {
    String alumnoToken = accessToken("alumno@example.com");
    String body = objectMapper.writeValueAsString(new ConversacionCreateRequest(alumnoCompatibleId));

    String createResponse = mockMvc.perform(post("/api/mensajes/conversaciones")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + alumnoToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(body))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.otroParticipanteNombre").value("Ana Compatible"))
        .andReturn()
        .getResponse()
        .getContentAsString();
    Long createdId = objectMapper.readTree(createResponse).get("id").asLong();

    mockMvc.perform(post("/api/mensajes/conversaciones")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + alumnoToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(body))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").value(createdId));
  }

  @Test
  void createsConversationBetweenStudentAndTeacher() throws Exception {
    mockMvc.perform(post("/api/mensajes/conversaciones")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(new ConversacionCreateRequest(tutorId))))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.otroParticipanteNombre").value("Tutor Demo"));
  }

  @Test
  void rejectsConversationWithNonCompatibleContact() throws Exception {
    UserAccount other = userAccountRepository.findByEmailIgnoreCase("alumno-otra@example.com").orElseThrow();

    mockMvc.perform(post("/api/mensajes/conversaciones")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(new ConversacionCreateRequest(other.getId()))))
        .andExpect(status().isForbidden());
  }

  @Test
  void requiresAuthentication() throws Exception {
    mockMvc.perform(get("/api/mensajes/conversaciones"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void listsOnlyUserConversations() throws Exception {
    mockMvc.perform(get("/api/mensajes/conversaciones")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].id").value(conversacionId))
        .andExpect(jsonPath("$[0].titulo").value("Empresa Demo"))
        .andExpect(jsonPath("$[0].otroParticipanteNombre").value("Empresa Demo"))
        .andExpect(jsonPath("$[0].ultimoMensaje").value("Hola, revisamos tu solicitud."))
        .andExpect(jsonPath("$[0].ultimoMensajePropio").value(false));
  }

  @Test
  void listsMessagesAndMarksOwnMessages() throws Exception {
    mockMvc.perform(get("/api/mensajes/conversaciones/{id}", conversacionId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].remitenteNombre").value("Empresa Demo"))
        .andExpect(jsonPath("$[0].contenido").value("Hola, revisamos tu solicitud."))
        .andExpect(jsonPath("$[0].propio").value(true));
  }

  @Test
  void sendsMessageInExistingConversation() throws Exception {
    mockMvc.perform(post("/api/mensajes/conversaciones/{id}/mensajes", conversacionId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(new MensajeRequest("Gracias, quedo atento."))))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.contenido").value("Gracias, quedo atento."))
        .andExpect(jsonPath("$.remitenteNombre").value("Alumno Demo"))
        .andExpect(jsonPath("$.propio").value(true));

    mockMvc.perform(get("/api/mensajes/conversaciones/{id}", conversacionId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(2))
        .andExpect(jsonPath("$[1].contenido").value("Gracias, quedo atento."));
  }

  @Test
  void rejectsEmptyMessagesAndForeignConversations() throws Exception {
    mockMvc.perform(post("/api/mensajes/conversaciones/{id}/mensajes", conversacionId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(new MensajeRequest("   "))))
        .andExpect(status().isBadRequest());

    mockMvc.perform(get("/api/mensajes/conversaciones/{id}", conversacionId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("tutor@example.com")))
        .andExpect(status().isNotFound());
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

  private void savePreferences(UserAccount alumno, String familiaProfesional) {
    AlumnoPreferencias preferencias = new AlumnoPreferencias(alumno);
    preferencias.update(
        familiaProfesional,
        "Desarrollo de Aplicaciones Web",
        "Valencia",
        OfertaModalidad.PRESENCIAL,
        LocalDate.of(2026, 9, 1),
        null);
    preferenciasRepository.save(preferencias);
  }
}
