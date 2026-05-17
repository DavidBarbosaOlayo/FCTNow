package com.fctnow.backend.asignaciones;

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
import com.fctnow.backend.notificaciones.Notificacion;
import com.fctnow.backend.notificaciones.NotificacionRepository;
import com.fctnow.backend.notificaciones.NotificacionTipo;
import com.fctnow.backend.ofertas.OfertaEstado;
import com.fctnow.backend.ofertas.OfertaFct;
import com.fctnow.backend.ofertas.OfertaFctRepository;
import com.fctnow.backend.ofertas.OfertaModalidad;
import com.fctnow.backend.solicitudes.SolicitudEstado;
import com.fctnow.backend.solicitudes.SolicitudFct;
import com.fctnow.backend.solicitudes.SolicitudFctRepository;
import com.fctnow.backend.user.UserAccount;
import com.fctnow.backend.user.UserAccountRepository;
import com.fctnow.backend.user.UserRole;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
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
class AsignacionFctControllerTest {

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

  private Long solicitudAceptadaId;
  private Long segundaSolicitudAceptadaMismoAlumnoId;
  private Long solicitudPendienteId;
  private Long solicitudRechazadaId;

  @BeforeEach
  void setUp() {
    asignacionFctRepository.deleteAll();
    notificacionRepository.deleteAll();
    solicitudFctRepository.deleteAll();
    ofertaFctRepository.deleteAll();
    userAccountRepository.deleteAll();
    empresaRepository.deleteAll();

    Empresa empresa = empresaRepository.save(new Empresa(
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

    userAccountRepository.save(new UserAccount(
        "tutor@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Tutor Centro",
        Set.of(UserRole.TUTOR_CENTRO)));

    userAccountRepository.save(new UserAccount(
        "coordinador@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Coordinador",
        Set.of(UserRole.COORDINADOR)));

    userAccountRepository.save(new UserAccount(
        "empresa@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Empresa",
        Set.of(UserRole.EMPRESA),
        empresa.getId()));

    UserAccount alumno = userAccountRepository.save(new UserAccount(
        "alumno-a@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Alumno Demo A",
        Set.of(UserRole.ALUMNO)));

    UserAccount alumnoB = userAccountRepository.save(new UserAccount(
        "alumno-b@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Alumno Demo B",
        Set.of(UserRole.ALUMNO)));

    UserAccount alumnoC = userAccountRepository.save(new UserAccount(
        "alumno-c@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Alumno Demo C",
        Set.of(UserRole.ALUMNO)));

    OfertaFct oferta = ofertaFctRepository.save(new OfertaFct(
        empresa,
        "Practicas DAW",
        "Descripcion de la oferta.",
        "Informatica y comunicaciones",
        "Desarrollo de Aplicaciones Web",
        "Valencia",
        "Valencia",
        OfertaModalidad.PRESENCIAL,
        LocalDate.of(2026, 9, 15),
        LocalDate.of(2026, 12, 15),
        3,
        null,
        "Tareas variadas.",
        OfertaEstado.PUBLICADA));

    SolicitudFct aceptada = new SolicitudFct(alumno, oferta);
    aceptada.changeEstado(SolicitudEstado.ACEPTADA);
    solicitudAceptadaId = solicitudFctRepository.save(aceptada).getId();

    OfertaFct segundaOferta = ofertaFctRepository.save(new OfertaFct(
        empresa,
        "Practicas soporte",
        "Descripcion de la segunda oferta.",
        "Informatica y comunicaciones",
        "Administracion de Sistemas",
        "Valencia",
        "Valencia",
        OfertaModalidad.PRESENCIAL,
        LocalDate.of(2026, 10, 1),
        LocalDate.of(2026, 12, 20),
        1,
        null,
        "Soporte tecnico.",
        OfertaEstado.PUBLICADA));

    SolicitudFct segundaAceptada = new SolicitudFct(alumno, segundaOferta);
    segundaAceptada.changeEstado(SolicitudEstado.ACEPTADA);
    segundaSolicitudAceptadaMismoAlumnoId = solicitudFctRepository.save(segundaAceptada).getId();

    solicitudPendienteId = solicitudFctRepository.save(new SolicitudFct(alumnoB, oferta)).getId();

    SolicitudFct rechazada = new SolicitudFct(alumnoC, oferta);
    rechazada.changeEstado(SolicitudEstado.RECHAZADA);
    solicitudRechazadaId = solicitudFctRepository.save(rechazada).getId();
  }

  @Test
  void listRequiresAuthentication() throws Exception {
    mockMvc.perform(get("/api/asignaciones"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void listAllowsTutorCentro() throws Exception {
    mockMvc.perform(get("/api/asignaciones")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("tutor@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(0));
  }

  @Test
  void listAllowsCoordinador() throws Exception {
    mockMvc.perform(get("/api/asignaciones")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("coordinador@example.com")))
        .andExpect(status().isOk());
  }

  @Test
  void listRejectsAlumno() throws Exception {
    mockMvc.perform(get("/api/asignaciones")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno-a@example.com")))
        .andExpect(status().isForbidden());
  }

  @Test
  void listRejectsEmpresa() throws Exception {
    mockMvc.perform(get("/api/asignaciones")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa@example.com")))
        .andExpect(status().isForbidden());
  }

  @Test
  void createAsTutorFromAcceptedSolicitud() throws Exception {
    mockMvc.perform(post("/api/asignaciones")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("tutor@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"solicitudId\":" + solicitudAceptadaId
                + ",\"observaciones\":\"  Inicia el lunes  \""
                + ",\"horasTotales\":400"
                + ",\"fechaInicio\":\"" + LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE) + "\""
                + ",\"horasDiariasEstimadas\":7"
                + ",\"remunerada\":true"
                + ",\"importeMensual\":350.00"
                + ",\"observacionesRetribucion\":\" Beca mensual \"}"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.estado").value("ACTIVA"))
        .andExpect(jsonPath("$.solicitudId").value(solicitudAceptadaId.intValue()))
        .andExpect(jsonPath("$.alumno.email").value("alumno-a@example.com"))
        .andExpect(jsonPath("$.oferta.titulo").value("Practicas DAW"))
        .andExpect(jsonPath("$.empresa.nombre").value("Tech Norte Formacion"))
        .andExpect(jsonPath("$.observaciones").value("Inicia el lunes"))
        .andExpect(jsonPath("$.seguimiento.horasTotales").value(400))
        .andExpect(jsonPath("$.seguimiento.horasDiariasEstimadas").value(7))
        .andExpect(jsonPath("$.seguimiento.remunerada").value(true))
        .andExpect(jsonPath("$.seguimiento.importeMensual").value(350.00))
        .andExpect(jsonPath("$.seguimiento.observacionesRetribucion").value("Beca mensual"));
  }

  @Test
  void createRequiresHorasTotales() throws Exception {
    mockMvc.perform(post("/api/asignaciones")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("tutor@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"solicitudId\":" + solicitudAceptadaId
                + ",\"fechaInicio\":\"" + LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE) + "\""
                + ",\"horasDiariasEstimadas\":7"
                + ",\"remunerada\":false}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void createRejectsHorasTotalesOutOfRange() throws Exception {
    mockMvc.perform(post("/api/asignaciones")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("tutor@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"solicitudId\":" + solicitudAceptadaId
                + ",\"horasTotales\":5"
                + ",\"fechaInicio\":\"" + LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE) + "\""
                + ",\"horasDiariasEstimadas\":7"
                + ",\"remunerada\":false}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void createRejectsFechaInicioMuyAntigua() throws Exception {
    String past = LocalDate.now().minusDays(120).format(DateTimeFormatter.ISO_LOCAL_DATE);
    mockMvc.perform(post("/api/asignaciones")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("tutor@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"solicitudId\":" + solicitudAceptadaId
                + ",\"horasTotales\":400"
                + ",\"fechaInicio\":\"" + past + "\""
                + ",\"horasDiariasEstimadas\":7"
                + ",\"remunerada\":false}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void createRejectsImporteSinRemuneracion() throws Exception {
    mockMvc.perform(post("/api/asignaciones")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("tutor@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"solicitudId\":" + solicitudAceptadaId
                + ",\"horasTotales\":400"
                + ",\"fechaInicio\":\"" + LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE) + "\""
                + ",\"horasDiariasEstimadas\":7"
                + ",\"remunerada\":false"
                + ",\"importeMensual\":300.00}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void createNotifiesAssignedAlumno() throws Exception {
    mockMvc.perform(post("/api/asignaciones")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("tutor@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(validPayload(solicitudAceptadaId)))
        .andExpect(status().isCreated());

    mockMvc.perform(get("/api/notificaciones/me")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno-a@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].tipo").value("ASIGNACION_CREADA"))
        .andExpect(jsonPath("$[0].actionUrl").value("/alumno/solicitudes"));
  }

  @Test
  void createRemovesPendingAssignmentNotificationsForAlumno() throws Exception {
    UserAccount tutor = userAccountRepository.findByEmailIgnoreCase("tutor@example.com").orElseThrow();
    UserAccount coordinador = userAccountRepository.findByEmailIgnoreCase("coordinador@example.com").orElseThrow();
    UserAccount alumno = userAccountRepository.findByEmailIgnoreCase("alumno-a@example.com").orElseThrow();

    Notificacion readPending = pendingAssignmentNotification(tutor, alumno);
    readPending.marcarLeida();
    notificacionRepository.save(readPending);
    notificacionRepository.save(pendingAssignmentNotification(coordinador, alumno));

    mockMvc.perform(post("/api/asignaciones")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("tutor@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(validPayload(solicitudAceptadaId)))
        .andExpect(status().isCreated());

    mockMvc.perform(get("/api/notificaciones/me")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("tutor@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(0));

    mockMvc.perform(get("/api/notificaciones/me")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("coordinador@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(0));
  }

  @Test
  void createListsAfterwards() throws Exception {
    mockMvc.perform(post("/api/asignaciones")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("tutor@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(validPayload(solicitudAceptadaId)))
        .andExpect(status().isCreated());

    mockMvc.perform(get("/api/asignaciones")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("coordinador@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].alumno.displayName").value("Alumno Demo A"));
  }

  @Test
  void createFromSolicitadaIsConflict() throws Exception {
    mockMvc.perform(post("/api/asignaciones")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("tutor@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(validPayload(solicitudPendienteId)))
        .andExpect(status().isConflict());
  }

  @Test
  void createFromRechazadaIsConflict() throws Exception {
    mockMvc.perform(post("/api/asignaciones")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("tutor@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(validPayload(solicitudRechazadaId)))
        .andExpect(status().isConflict());
  }

  @Test
  void createDuplicateForSameSolicitudIsConflict() throws Exception {
    mockMvc.perform(post("/api/asignaciones")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("tutor@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(validPayload(solicitudAceptadaId)))
        .andExpect(status().isCreated());

    mockMvc.perform(post("/api/asignaciones")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("tutor@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(validPayload(solicitudAceptadaId)))
        .andExpect(status().isConflict());
  }

  @Test
  void createDuplicateActiveAssignmentForSameAlumnoIsConflict() throws Exception {
    mockMvc.perform(post("/api/asignaciones")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("tutor@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(validPayload(solicitudAceptadaId)))
        .andExpect(status().isCreated());

    mockMvc.perform(post("/api/asignaciones")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("tutor@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(validPayload(segundaSolicitudAceptadaMismoAlumnoId)))
        .andExpect(status().isConflict());
  }

  @Test
  void createWithUnknownSolicitudIsNotFound() throws Exception {
    mockMvc.perform(post("/api/asignaciones")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("tutor@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(validPayload(999999L)))
        .andExpect(status().isNotFound());
  }

  @Test
  void createRejectsAlumno() throws Exception {
    mockMvc.perform(post("/api/asignaciones")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno-a@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(validPayload(solicitudAceptadaId)))
        .andExpect(status().isForbidden());
  }

  @Test
  void createRejectsEmpresa() throws Exception {
    mockMvc.perform(post("/api/asignaciones")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("empresa@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(validPayload(solicitudAceptadaId)))
        .andExpect(status().isForbidden());
  }

  @Test
  void candidatasRequiresAuthentication() throws Exception {
    mockMvc.perform(get("/api/asignaciones/candidatas"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void candidatasListsOnlyAceptadasWithoutAsignacion() throws Exception {
    mockMvc.perform(get("/api/asignaciones/candidatas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("tutor@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(2))
        .andExpect(jsonPath("$[1].solicitudId").value(solicitudAceptadaId.intValue()))
        .andExpect(jsonPath("$[1].alumno.email").value("alumno-a@example.com"))
        .andExpect(jsonPath("$[1].oferta.titulo").value("Practicas DAW"))
        .andExpect(jsonPath("$[1].empresa.nombre").value("Tech Norte Formacion"));
  }

  @Test
  void candidatasExcludesAlreadyAssigned() throws Exception {
    mockMvc.perform(post("/api/asignaciones")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("tutor@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(validPayload(solicitudAceptadaId)))
        .andExpect(status().isCreated());

    mockMvc.perform(get("/api/asignaciones/candidatas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("tutor@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(0));
  }

  @Test
  void candidatasRejectsAlumno() throws Exception {
    mockMvc.perform(get("/api/asignaciones/candidatas")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("alumno-a@example.com")))
        .andExpect(status().isForbidden());
  }

  @Test
  void createRequiresSolicitudId() throws Exception {
    mockMvc.perform(post("/api/asignaciones")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("tutor@example.com"))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{}"))
        .andExpect(status().isBadRequest());
  }

  private String validPayload(Long solicitudId) {
    return "{\"solicitudId\":" + solicitudId
        + ",\"horasTotales\":400"
        + ",\"fechaInicio\":\"" + LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE) + "\""
        + ",\"horasDiariasEstimadas\":7"
        + ",\"remunerada\":false}";
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

  private Notificacion pendingAssignmentNotification(UserAccount destinatario, UserAccount alumno) {
    return new Notificacion(
        destinatario,
        alumno,
        NotificacionTipo.SOLICITUD_ACEPTADA_PENDIENTE_ASIGNACION,
        "Solicitud aceptada pendiente de asignacion",
        "Revisa la asignacion de practicas.",
        "/tutor?asignar=" + alumno.getId(),
        "Asignar practica",
        null,
        null,
        null,
        null,
        null);
  }
}
