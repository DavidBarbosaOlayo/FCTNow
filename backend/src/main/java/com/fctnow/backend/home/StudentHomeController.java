package com.fctnow.backend.home;

import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/alumnos/me/home")
public class StudentHomeController {

  private final StudentHomeService studentHomeService;

  public StudentHomeController(StudentHomeService studentHomeService) {
    this.studentHomeService = studentHomeService;
  }

  @GetMapping
  public StudentHomeResponse findMine(JwtAuthenticationToken authentication) {
    return studentHomeService.findMine(authentication);
  }
}
