package com.fctnow.backend.tutor;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fctnow.backend.alumnos.AlumnoPreferencias;
import com.fctnow.backend.alumnos.AlumnoPreferenciasRepository;
import com.fctnow.backend.asignaciones.AsignacionFct;
import com.fctnow.backend.asignaciones.AsignacionFctRepository;
import com.fctnow.backend.auth.LoginRequest;
import com.fctnow.backend.empresas.Empresa;
import com.fctnow.backend.empresas.EmpresaEstado;
import com.fctnow.backend.empresas.EmpresaRepository;
import com.fctnow.backend.empresas.IdentificadorFiscalTipo;
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
class TutorAlumnoControllerTest {

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
  private AlumnoPreferenciasRepository preferenciasRepository;

  @BeforeEach
  void setUp() {
    asignacionFctRepository.deleteAll();
    solicitudFctRepository.deleteAll();
    preferenciasRepository.deleteAll();
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

    UserAccount alumnoActivo = userAccountRepository.save(new UserAccount(
        "alumno-activo@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Alumno Activo",
        Set.of(UserRole.ALUMNO)));

    UserAccount alumnoSinDatos = userAccountRepository.save(new UserAccount(
        "alumno-vacio@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Alumno Vacio",
        Set.of(UserRole.ALUMNO)));

    UserAccount alumnoPendiente = userAccountRepository.save(new UserAccount(
        "alumno-pendiente@example.com",
        passwordEncoder.encode("CorrectPassword123!"),
        "Alumno Pendiente",
        Set.of(UserRole.ALUMNO)));

    AlumnoPreferencias prefs = new AlumnoPreferencias(alumnoActivo);
    prefs.update(
        "Informatica y comunicaciones",
        "Desarrollo de Aplicaciones Web",
        "Valencia",
        OfertaModalidad.PRESENCIAL,
        LocalDate.of(2026, 9, 1),
        "Disponibilidad inmediata");
    prefs.updatePhoto("foto-alumno.png", "image/png", "png-demo".getBytes());
    preferenciasRepository.save(prefs);

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

    SolicitudFct aceptada = new SolicitudFct(alumnoActivo, oferta);
    aceptada.changeEstado(SolicitudEstado.ACEPTADA);
    SolicitudFct savedAceptada = solicitudFctRepository.save(aceptada);

    asignacionFctRepository.save(new AsignacionFct(savedAceptada, "Inicia el lunes"));

    OfertaFct oferta2 = ofertaFctRepository.save(new OfertaFct(
        empresa,
        "Practicas Sistemas",
        "Descripcion 2.",
        "Informatica y comunicaciones",
        "Sistemas Microinformaticos",
        "Valencia",
        "Valencia",
        OfertaModalidad.PRESENCIAL,
        LocalDate.of(2026, 9, 15),
        LocalDate.of(2026, 12, 15),
        3,
        null,
        "Tareas variadas.",
        OfertaEstado.PUBLICADA));

    SolicitudFct rechazada = new SolicitudFct(alumnoActivo, oferta2);
    rechazada.changeEstado(SolicitudEstado.RECHAZADA);
    solicitudFctRepository.save(rechazada);

    SolicitudFct pendienteAsignar = new SolicitudFct(alumnoPendiente, oferta2);
    pendienteAsignar.changeEstado(SolicitudEstado.ACEPTADA);
    solicitudFctRepository.save(pendienteAsignar);
  }

  @Test
  void requiresAuthentication() throws Exception {
    mockMvc.perform(get("/api/tutor/alumnos"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void rejectsAlumno() throws Exception {
    UserAccount alumno = userAccountRepository.findByEmailIgnoreCase("alumno-activo@example.com").orElseThrow();
    String token = accessToken(alumno.getEmail());
    mockMvc.perform(get("/api/tutor/alumnos")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andExpect(status().isForbidden());
  }

  @Test
  void listsAggregatedDataForTutorCentro() throws Exception {
    mockMvc.perform(get("/api/tutor/alumnos")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("tutor@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(3))
        .andExpect(jsonPath("$[0].displayName").value("Alumno Pendiente"))
        .andExpect(jsonPath("$[0].asignacionPendiente.tipo").value("INTERNA"))
        .andExpect(jsonPath("$[0].asignacionPendiente.oferta").value("Practicas Sistemas"))
        .andExpect(jsonPath("$[1].displayName").value("Alumno Vacio"))
        .andExpect(jsonPath("$[1].preferencias").doesNotExist())
        .andExpect(jsonPath("$[1].solicitudes.total").value(0))
        .andExpect(jsonPath("$[1].asignacionActual").doesNotExist())
        .andExpect(jsonPath("$[2].displayName").value("Alumno Activo"))
        .andExpect(jsonPath("$[2].email").value("alumno-activo@example.com"))
        .andExpect(jsonPath("$[2].photoDataUrl").value("data:image/png;base64,cG5nLWRlbW8="))
        .andExpect(jsonPath("$[2].preferencias.cicloFormativo").value("Desarrollo de Aplicaciones Web"))
        .andExpect(jsonPath("$[2].solicitudes.total").value(2))
        .andExpect(jsonPath("$[2].solicitudes.aceptadas").value(1))
        .andExpect(jsonPath("$[2].solicitudes.rechazadas").value(1))
        .andExpect(jsonPath("$[2].asignacionActual.empresa").value("Tech Norte Formacion"))
        .andExpect(jsonPath("$[2].asignacionActual.oferta").value("Practicas DAW"))
        .andExpect(jsonPath("$[2].asignacionPendiente").doesNotExist());
  }

  @Test
  void listsAlsoAllowedForCoordinador() throws Exception {
    mockMvc.perform(get("/api/tutor/alumnos")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken("coordinador@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(3));
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
