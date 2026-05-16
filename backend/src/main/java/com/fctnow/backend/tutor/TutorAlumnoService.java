package com.fctnow.backend.tutor;

import com.fctnow.backend.alumnos.AlumnoPreferencias;
import com.fctnow.backend.alumnos.AlumnoPreferenciasRepository;
import com.fctnow.backend.alumnos.AlumnoPreferenciasResponse;
import com.fctnow.backend.alumnos.AlumnoCvResource;
import com.fctnow.backend.asignaciones.AsignacionFct;
import com.fctnow.backend.asignaciones.AsignacionFctRepository;
import com.fctnow.backend.asignaciones.externas.AsignacionFctExterna;
import com.fctnow.backend.asignaciones.externas.AsignacionFctExternaRepository;
import com.fctnow.backend.solicitudes.SolicitudEstado;
import com.fctnow.backend.solicitudes.SolicitudFct;
import com.fctnow.backend.solicitudes.SolicitudFctRepository;
import com.fctnow.backend.solicitudes.externas.SolicitudExterna;
import com.fctnow.backend.solicitudes.externas.SolicitudExternaEstado;
import com.fctnow.backend.solicitudes.externas.SolicitudExternaRepository;
import com.fctnow.backend.tutor.TutorAlumnoResponse.AsignacionActual;
import com.fctnow.backend.tutor.TutorAlumnoResponse.AsignacionPendiente;
import com.fctnow.backend.tutor.TutorAlumnoResponse.Preferencias;
import com.fctnow.backend.tutor.TutorAlumnoResponse.SolicitudesResumen;
import com.fctnow.backend.user.UserAccount;
import com.fctnow.backend.user.UserAccountRepository;
import com.fctnow.backend.user.UserRole;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TutorAlumnoService {

  private static final Set<UserRole> ROLES_PERMITIDOS =
      EnumSet.of(UserRole.TUTOR_CENTRO, UserRole.COORDINADOR);
  private static final String STUDENT_EMAIL_DOMAIN = "@fctnow.com";
  private static final String CENTRO_EMAIL_DOMAIN = "@elpuig.xeill.net";
  private static final String[] IMPORT_HEADERS = {
      "nombre",
      "username",
      "password",
      "correo_centro",
  };

  private final UserAccountRepository userAccountRepository;
  private final AlumnoPreferenciasRepository preferenciasRepository;
  private final SolicitudFctRepository solicitudFctRepository;
  private final SolicitudExternaRepository solicitudExternaRepository;
  private final AsignacionFctRepository asignacionFctRepository;
  private final AsignacionFctExternaRepository asignacionFctExternaRepository;
  private final PasswordEncoder passwordEncoder;
  private final AlumnoWelcomeMailer welcomeMailer;

  public TutorAlumnoService(
      UserAccountRepository userAccountRepository,
      AlumnoPreferenciasRepository preferenciasRepository,
      SolicitudFctRepository solicitudFctRepository,
      SolicitudExternaRepository solicitudExternaRepository,
      AsignacionFctRepository asignacionFctRepository,
      AsignacionFctExternaRepository asignacionFctExternaRepository,
      PasswordEncoder passwordEncoder,
      AlumnoWelcomeMailer welcomeMailer) {
    this.userAccountRepository = userAccountRepository;
    this.preferenciasRepository = preferenciasRepository;
    this.solicitudFctRepository = solicitudFctRepository;
    this.solicitudExternaRepository = solicitudExternaRepository;
    this.asignacionFctRepository = asignacionFctRepository;
    this.asignacionFctExternaRepository = asignacionFctExternaRepository;
    this.passwordEncoder = passwordEncoder;
    this.welcomeMailer = welcomeMailer;
  }

  @Transactional(readOnly = true)
  public List<TutorAlumnoResponse> findAlumnos(JwtAuthenticationToken authentication) {
    requireCentroRole(authentication);

    List<UserAccount> alumnos = userAccountRepository.findAllByRole(UserRole.ALUMNO).stream()
        .sorted(Comparator.comparing(
            UserAccount::getDisplayName,
            Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
        .toList();
    if (alumnos.isEmpty()) {
      return List.of();
    }

    List<Long> ids = alumnos.stream().map(UserAccount::getId).toList();

    Map<Long, AlumnoPreferencias> preferenciasByAlumno = new HashMap<>();
    for (AlumnoPreferencias p : preferenciasRepository.findByAlumnoIdIn(ids)) {
      preferenciasByAlumno.put(p.getAlumno().getId(), p);
    }

    Map<Long, List<SolicitudFct>> solByAlumno = new HashMap<>();
    for (SolicitudFct s : solicitudFctRepository.findByAlumnoIdIn(ids)) {
      solByAlumno.computeIfAbsent(s.getAlumno().getId(), k -> new java.util.ArrayList<>()).add(s);
    }

    Map<Long, List<SolicitudExterna>> solExtByAlumno = new HashMap<>();
    for (SolicitudExterna s : solicitudExternaRepository.findByAlumnoIdIn(ids)) {
      solExtByAlumno.computeIfAbsent(s.getAlumno().getId(), k -> new java.util.ArrayList<>()).add(s);
    }

    Map<Long, AsignacionFct> asigByAlumno = new HashMap<>();
    for (AsignacionFct a : asignacionFctRepository.findByAlumnoIdInWithDetails(ids)) {
      asigByAlumno.merge(a.getAlumno().getId(), a, (existing, candidate) ->
          candidate.getFechaAsignacion().isAfter(existing.getFechaAsignacion()) ? candidate : existing);
    }

    Map<Long, AsignacionFctExterna> asigExtByAlumno = new HashMap<>();
    for (AsignacionFctExterna a : asignacionFctExternaRepository.findByAlumnoIdInWithDetails(ids)) {
      asigExtByAlumno.merge(a.getAlumno().getId(), a, (existing, candidate) ->
          candidate.getFechaAsignacion().isAfter(existing.getFechaAsignacion()) ? candidate : existing);
    }

    Map<Long, SolicitudFct> candidataByAlumno = new HashMap<>();
    for (SolicitudFct s : solicitudFctRepository.findAceptadasSinAsignacion()) {
      candidataByAlumno.merge(s.getAlumno().getId(), s, (existing, candidate) ->
          candidate.getCreatedAt().isAfter(existing.getCreatedAt()) ? candidate : existing);
    }

    Map<Long, SolicitudExterna> candidataExtByAlumno = new HashMap<>();
    for (SolicitudExterna s : solicitudExternaRepository.findAceptadasSinAsignacion()) {
      candidataExtByAlumno.merge(s.getAlumno().getId(), s, (existing, candidate) ->
          candidate.getUpdatedAt().isAfter(existing.getUpdatedAt()) ? candidate : existing);
    }

    return alumnos.stream()
        .map(alumno -> buildResponse(
            alumno,
            preferenciasByAlumno.get(alumno.getId()),
            solByAlumno.getOrDefault(alumno.getId(), List.of()),
            solExtByAlumno.getOrDefault(alumno.getId(), List.of()),
            asigByAlumno.get(alumno.getId()),
            asigExtByAlumno.get(alumno.getId()),
            candidataByAlumno.get(alumno.getId()),
            candidataExtByAlumno.get(alumno.getId())))
        .sorted(Comparator
            .comparing((TutorAlumnoResponse a) -> a.asignacionActual() != null)
            .thenComparing(
                TutorAlumnoResponse::displayName,
                Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
        .toList();
  }

  @Transactional
  public TutorAlumnoResponse createAlumno(
      TutorAlumnoCreateRequest request,
      JwtAuthenticationToken authentication) {
    requireCentroRole(authentication);

    String centroEmail = normalizeCentroEmail(request.centroEmail());
    AlumnoImportData data = new AlumnoImportData(
        trimToNull(request.displayName()),
        normalizeFctNowEmail(request.username()),
        request.password(),
        centroEmail);

    if (data.email() == null || userAccountRepository.findByEmailIgnoreCase(data.email()).isPresent()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una cuenta con ese email");
    }

    UserAccount alumno = createAlumnoAccount(data);
    welcomeMailer.sendWelcome(
        alumno.getCentroEmail(),
        alumno.getDisplayName(),
        alumno.getEmail(),
        data.password());
    return buildResponse(alumno, null, List.of(), List.of(), null, null, null, null);
  }

  @Transactional(readOnly = true)
  public byte[] createImportTemplate(JwtAuthenticationToken authentication) {
    requireCentroRole(authentication);

    try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
      Sheet sheet = workbook.createSheet("alumnos");
      CellStyle headerStyle = workbook.createCellStyle();
      Font headerFont = workbook.createFont();
      headerFont.setBold(true);
      headerStyle.setFont(headerFont);
      headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
      headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

      Row header = sheet.createRow(0);
      for (int i = 0; i < IMPORT_HEADERS.length; i++) {
        Cell cell = header.createCell(i);
        cell.setCellValue(IMPORT_HEADERS[i]);
        cell.setCellStyle(headerStyle);
        sheet.setColumnWidth(i, 24 * 256);
      }

      Row sample = sheet.createRow(1);
      sample.createCell(0).setCellValue("Nombre Alumno");
      sample.createCell(1).setCellValue("nombre.apellido");
      sample.createCell(2).setCellValue("Password123!");
      sample.createCell(3).setCellValue("nalumno@elpuig.xeill.net");

      workbook.write(out);
      return out.toByteArray();
    } catch (IOException ex) {
      throw new ResponseStatusException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          "No se pudo generar la plantilla de alumnos",
          ex);
    }
  }

  @Transactional
  public TutorAlumnoImportResultResponse importAlumnos(
      MultipartFile file,
      JwtAuthenticationToken authentication) {
    requireCentroRole(authentication);
    if (file == null || file.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El archivo Excel no puede estar vacio");
    }

    List<TutorAlumnoImportRowResponse> rows = new ArrayList<>();
    Set<String> emailsInFile = new HashSet<>();
    DataFormatter formatter = new DataFormatter();

    try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
      Sheet sheet = workbook.getNumberOfSheets() == 0 ? null : workbook.getSheetAt(0);
      if (sheet == null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El Excel no contiene hojas");
      }

      for (int i = 1; i <= sheet.getLastRowNum(); i++) {
        Row row = sheet.getRow(i);
        if (isBlankRow(row, formatter)) {
          continue;
        }
        rows.add(processImportRow(row, formatter, emailsInFile));
      }
    } catch (IOException | IllegalArgumentException ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se pudo leer el archivo Excel", ex);
    }

    int creados = (int) rows.stream().filter(r -> "CREADO".equals(r.estado())).count();
    int omitidos = (int) rows.stream().filter(r -> "OMITIDO".equals(r.estado())).count();
    int errores = (int) rows.stream().filter(r -> "ERROR".equals(r.estado())).count();
    return new TutorAlumnoImportResultResponse(creados, omitidos, errores, rows);
  }

  private TutorAlumnoResponse buildResponse(
      UserAccount alumno,
      AlumnoPreferencias prefs,
      List<SolicitudFct> sol,
      List<SolicitudExterna> solExt,
      AsignacionFct asig,
      AsignacionFctExterna asigExt,
      SolicitudFct candidata,
      SolicitudExterna candidataExt) {
    Preferencias preferencias = prefs == null
        ? null
        : new Preferencias(
            prefs.getFamiliaProfesional(),
            prefs.getCicloFormativo(),
            prefs.getLocalidadPreferida(),
            prefs.getModalidadPreferida() == null ? null : prefs.getModalidadPreferida().name(),
            prefs.getFechaDisponibilidad(),
            prefs.getObservaciones());

    int internalSolicitadas = (int) sol.stream()
        .filter(s -> s.getEstado() == SolicitudEstado.SOLICITADA)
        .count();
    int internalAceptadas = (int) sol.stream()
        .filter(s -> s.getEstado() == SolicitudEstado.ACEPTADA)
        .count();
    int internalRechazadas = (int) sol.stream()
        .filter(s -> s.getEstado() == SolicitudEstado.RECHAZADA)
        .count();

    int externalSolicitadas = (int) solExt.stream()
        .filter(s -> s.getEstado() == SolicitudExternaEstado.SOLICITADA)
        .count();
    int externalAceptadas = (int) solExt.stream()
        .filter(s -> s.getEstado() == SolicitudExternaEstado.ACEPTADA)
        .count();
    int externalRechazadas = (int) solExt.stream()
        .filter(s -> s.getEstado() == SolicitudExternaEstado.RECHAZADA
            || s.getEstado() == SolicitudExternaEstado.RETIRADA)
        .count();

    SolicitudesResumen resumen = new SolicitudesResumen(
        sol.size() + solExt.size(),
        internalSolicitadas + externalSolicitadas,
        internalAceptadas + externalAceptadas,
        internalRechazadas + externalRechazadas);

    AsignacionActual asignacionActual = pickAsignacion(asig, asigExt);
    AsignacionPendiente asignacionPendiente = asignacionActual == null
        ? pickAsignacionPendiente(candidata, candidataExt)
        : null;

    return new TutorAlumnoResponse(
        alumno.getId(),
        alumno.getEmail(),
        alumno.getCentroEmail(),
        alumno.getDisplayName(),
        alumno.isEnabled(),
        AlumnoPreferenciasResponse.photoDataUrl(prefs),
        prefs != null && prefs.getCvContent() != null,
        prefs == null ? null : prefs.getCvFileName(),
        prefs == null ? null : prefs.getCvContentType(),
        prefs == null ? null : prefs.getCvSize(),
        prefs == null ? null : prefs.getCvUpdatedAt(),
        preferencias,
        resumen,
        asignacionActual,
        asignacionPendiente);
  }

  private TutorAlumnoImportRowResponse processImportRow(
      Row row,
      DataFormatter formatter,
      Set<String> emailsInFile) {
    int rowNumber = row.getRowNum() + 1;
    String displayName = trimToNull(cellText(row, 0, formatter));
    String email;
    try {
      email = normalizeFctNowEmail(cellText(row, 1, formatter));
    } catch (ResponseStatusException ex) {
      return new TutorAlumnoImportRowResponse(
          rowNumber,
          null,
          displayName,
          "ERROR",
          ex.getReason() == null ? "El username no tiene un formato valido" : ex.getReason());
    }
    String password = cellText(row, 2, formatter);
    String centroEmail;
    try {
      centroEmail = normalizeCentroEmail(cellText(row, 3, formatter));
    } catch (ResponseStatusException ex) {
      return new TutorAlumnoImportRowResponse(
          rowNumber,
          email,
          displayName,
          "ERROR",
          ex.getReason() == null ? "El correo del centro no tiene un formato valido" : ex.getReason());
    }

    AlumnoImportData data = new AlumnoImportData(
        displayName,
        email,
        password,
        centroEmail);

    String validationError = validateImportData(data);
    if (validationError != null) {
      return new TutorAlumnoImportRowResponse(rowNumber, email, displayName, "ERROR", validationError);
    }
    if (!emailsInFile.add(data.email())) {
      return new TutorAlumnoImportRowResponse(
          rowNumber,
          data.email(),
          data.displayName(),
          "OMITIDO",
          "Email duplicado en el archivo");
    }
    if (userAccountRepository.findByEmailIgnoreCase(data.email()).isPresent()) {
      return new TutorAlumnoImportRowResponse(
          rowNumber,
          data.email(),
          data.displayName(),
          "OMITIDO",
          "Ya existe una cuenta con este email");
    }

    UserAccount alumno = createAlumnoAccount(data);
    welcomeMailer.sendWelcome(
        alumno.getCentroEmail(),
        alumno.getDisplayName(),
        alumno.getEmail(),
        data.password());
    return new TutorAlumnoImportRowResponse(
        rowNumber,
        data.email(),
        data.displayName(),
        "CREADO",
        "Alumno creado correctamente");
  }

  private UserAccount createAlumnoAccount(AlumnoImportData data) {
    return userAccountRepository.save(new UserAccount(
        data.email(),
        passwordEncoder.encode(data.password()),
        data.displayName(),
        Set.of(UserRole.ALUMNO),
        null,
        data.centroEmail()));
  }

  private String validateImportData(AlumnoImportData data) {
    if (data.displayName() == null) {
      return "El nombre es obligatorio";
    }
    if (data.email() == null) {
      return "El username es obligatorio";
    }
    if (data.password() == null || data.password().isBlank()) {
      return "La password es obligatoria";
    }
    if (data.password().length() < 8) {
      return "La password debe tener al menos 8 caracteres";
    }
    if (data.centroEmail() == null) {
      return "El correo del centro es obligatorio";
    }
    return null;
  }

  private boolean isBlankRow(Row row, DataFormatter formatter) {
    if (row == null) {
      return true;
    }
    for (int i = 0; i < IMPORT_HEADERS.length; i++) {
      if (trimToNull(cellText(row, i, formatter)) != null) {
        return false;
      }
    }
    return true;
  }

  private String cellText(Row row, int column, DataFormatter formatter) {
    Cell cell = row.getCell(column, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
    return cell == null ? null : formatter.formatCellValue(cell);
  }

  private String normalizeCentroEmail(String value) {
    String trimmed = trimToNull(value);
    if (trimmed == null) {
      return null;
    }
    String normalized = trimmed.toLowerCase(Locale.ROOT).replaceAll("\\s+", "");
    if (!normalized.endsWith(CENTRO_EMAIL_DOMAIN)) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "El correo del centro debe usar el dominio " + CENTRO_EMAIL_DOMAIN);
    }
    String localPart = normalized.substring(0, normalized.length() - CENTRO_EMAIL_DOMAIN.length());
    if (localPart.isBlank()
        || localPart.contains("@")
        || localPart.startsWith(".")
        || localPart.endsWith(".")) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "El correo del centro no tiene un formato valido");
    }
    return normalized;
  }

  private String normalizeFctNowEmail(String username) {
    String value = trimToNull(username);
    if (value == null) {
      return null;
    }
    String normalized = value.toLowerCase(Locale.ROOT);
    normalized = normalized.replaceAll("\\s+", "");
    if (normalized.contains("@") && !normalized.endsWith(STUDENT_EMAIL_DOMAIN)) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "El username debe usar el dominio @fctnow.com");
    }

    String localPart = normalized.endsWith(STUDENT_EMAIL_DOMAIN)
        ? normalized.substring(0, normalized.length() - STUDENT_EMAIL_DOMAIN.length())
        : normalized;
    if (localPart.isBlank()
        || localPart.contains("@")
        || localPart.startsWith(".")
        || localPart.endsWith(".")) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El username no tiene un formato valido");
    }
    return normalized.endsWith(STUDENT_EMAIL_DOMAIN)
        ? normalized
        : normalized + STUDENT_EMAIL_DOMAIN;
  }

  private String trimToNull(String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }

  @Transactional(readOnly = true)
  public AlumnoCvResource findAlumnoCv(Long alumnoId, JwtAuthenticationToken authentication) {
    requireCentroRole(authentication);
    UserAccount alumno = userAccountRepository.findById(alumnoId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Alumno no encontrado"));

    if (!alumno.getRoles().contains(UserRole.ALUMNO)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Alumno no encontrado");
    }

    AlumnoPreferencias preferencias = preferenciasRepository.findByAlumnoId(alumnoId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CV no encontrado"));

    if (preferencias.getCvContent() == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "CV no encontrado");
    }

    return new AlumnoCvResource(
        preferencias.getCvFileName(),
        preferencias.getCvContentType(),
        preferencias.getCvContent());
  }

  private AsignacionActual pickAsignacion(AsignacionFct asig, AsignacionFctExterna asigExt) {
    if (asig == null && asigExt == null) {
      return null;
    }
    if (asig != null && asigExt != null) {
      AsignacionFct a = asig;
      AsignacionFctExterna e = asigExt;
      boolean externalNewer =
          Comparator.<java.time.Instant>naturalOrder().compare(
              e.getFechaAsignacion(), a.getFechaAsignacion()) > 0;
      return externalNewer ? toAsignacionActual(e) : toAsignacionActual(a);
    }
    if (asig != null) {
      return toAsignacionActual(asig);
    }
    return toAsignacionActual(asigExt);
  }

  private AsignacionActual toAsignacionActual(AsignacionFct a) {
    return new AsignacionActual(
        a.getId(),
        a.getEstado(),
        a.getFechaAsignacion(),
        a.getOferta().getTitulo(),
        a.getEmpresa().getNombre(),
        a.getObservaciones());
  }

  private AsignacionActual toAsignacionActual(AsignacionFctExterna a) {
    SolicitudExterna s = a.getSolicitud();
    String empresa = s.getEmpresaNombre() == null || s.getEmpresaNombre().isBlank()
        ? "Empresa externa"
        : s.getEmpresaNombre();
    return new AsignacionActual(
        a.getId(),
        a.getEstado(),
        a.getFechaAsignacion(),
        s.getTitulo(),
        empresa,
        a.getObservaciones());
  }

  private AsignacionPendiente pickAsignacionPendiente(
      SolicitudFct candidata,
      SolicitudExterna candidataExt) {
    if (candidata == null && candidataExt == null) {
      return null;
    }
    if (candidata != null && candidataExt != null) {
      return candidataExt.getUpdatedAt().isAfter(candidata.getCreatedAt())
          ? toAsignacionPendiente(candidataExt)
          : toAsignacionPendiente(candidata);
    }
    return candidata != null
        ? toAsignacionPendiente(candidata)
        : toAsignacionPendiente(candidataExt);
  }

  private AsignacionPendiente toAsignacionPendiente(SolicitudFct s) {
    return new AsignacionPendiente(
        "INTERNA",
        s.getId(),
        s.getCreatedAt(),
        s.getOferta().getTitulo(),
        s.getOferta().getEmpresa().getNombre(),
        s.getOferta().getLocalidad(),
        null);
  }

  private AsignacionPendiente toAsignacionPendiente(SolicitudExterna s) {
    String empresa = s.getEmpresaNombre() == null || s.getEmpresaNombre().isBlank()
        ? "Empresa externa"
        : s.getEmpresaNombre();
    return new AsignacionPendiente(
        "EXTERNA",
        s.getId(),
        s.getUpdatedAt(),
        s.getTitulo(),
        empresa,
        s.getLocalidad(),
        s.getUrlAplicacion());
  }

  private void requireCentroRole(JwtAuthenticationToken authentication) {
    UserAccount userAccount = userAccountRepository.findByEmailIgnoreCase(authentication.getName())
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.UNAUTHORIZED,
            "Sesion no valida"));

    boolean tieneRol = userAccount.getRoles().stream().anyMatch(ROLES_PERMITIDOS::contains);
    if (!tieneRol) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          "Solo el personal del centro puede consultar el panel de tutor");
    }
  }

  private record AlumnoImportData(
      String displayName,
      String email,
      String password,
      String centroEmail) {
  }
}
