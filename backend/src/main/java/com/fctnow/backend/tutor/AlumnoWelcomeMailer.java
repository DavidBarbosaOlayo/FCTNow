package com.fctnow.backend.tutor;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

@Component
public class AlumnoWelcomeMailer {

  private static final Logger log = LoggerFactory.getLogger(AlumnoWelcomeMailer.class);

  private final JavaMailSender mailSender;
  private final String from;
  private final String fromName;
  private final String loginUrl;

  public AlumnoWelcomeMailer(
      JavaMailSender mailSender,
      @Value("${fctnow.mail.from:noreply@fctnow.local}") String from,
      @Value("${fctnow.mail.from-name:FCTNow}") String fromName,
      @Value("${fctnow.mail.login-url:http://localhost:4200/login}") String loginUrl) {
    this.mailSender = mailSender;
    this.from = from;
    this.fromName = fromName;
    this.loginUrl = loginUrl;
  }

  public void sendWelcome(
      String centroEmail,
      String displayName,
      String loginEmail,
      String password) {
    if (centroEmail == null || centroEmail.isBlank()) {
      return;
    }

    try {
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(
          message, false, StandardCharsets.UTF_8.name());
      helper.setFrom(new InternetAddress(from, fromName, StandardCharsets.UTF_8.name()));
      helper.setTo(centroEmail);
      helper.setSubject("Tu cuenta en FCTNow");
      helper.setText(buildBody(displayName, loginEmail, password), true);
      mailSender.send(message);
      log.info("Sent welcome email to {}", centroEmail);
    } catch (MailException | MessagingException | UnsupportedEncodingException ex) {
      log.warn("Failed to send welcome email to {}: {}", centroEmail, ex.getMessage());
    }
  }

  private String buildBody(String displayName, String loginEmail, String password) {
    String safeName = displayName == null ? "" : escapeHtml(displayName);
    String safeLogin = escapeHtml(loginEmail);
    String safePassword = escapeHtml(password);
    String safeUrl = escapeHtml(loginUrl);
    return """
        <p>Hola %s,</p>
        <p>Tu cuenta en <strong>FCTNow</strong> ya está creada. Estos son tus datos de acceso:</p>
        <ul>
          <li><strong>Usuario:</strong> %s</li>
          <li><strong>Contraseña:</strong> %s</li>
        </ul>
        <p>Entra a la plataforma: <a href="%s">%s</a></p>
        <p>Por seguridad, te recomendamos cambiar la contraseña tras el primer acceso.</p>
        <p>— Equipo FCTNow</p>
        """.formatted(safeName, safeLogin, safePassword, safeUrl, safeUrl);
  }

  private String escapeHtml(String value) {
    if (value == null) {
      return "";
    }
    return value
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;")
        .replace("'", "&#39;");
  }
}
