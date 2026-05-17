package com.fctnow.backend.user;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users/me")
@Tag(name = "Perfil usuario", description = "Foto de perfil del usuario autenticado")
public class UserProfilePhotoController {

  private final UserProfilePhotoService userProfilePhotoService;

  public UserProfilePhotoController(UserProfilePhotoService userProfilePhotoService) {
    this.userProfilePhotoService = userProfilePhotoService;
  }

  @GetMapping("/foto")
  @Operation(summary = "Get the authenticated user's profile photo")
  @SecurityRequirement(name = "bearerAuth")
  public UserProfilePhotoResponse mine(JwtAuthenticationToken authentication) {
    return userProfilePhotoService.findMine(authentication);
  }

  @PutMapping(value = "/foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @Operation(summary = "Upload or replace the authenticated user's profile photo")
  @SecurityRequirement(name = "bearerAuth")
  public UserProfilePhotoResponse uploadPhoto(
      @RequestPart("file") MultipartFile file,
      JwtAuthenticationToken authentication) {
    return userProfilePhotoService.uploadPhoto(file, authentication);
  }
}
