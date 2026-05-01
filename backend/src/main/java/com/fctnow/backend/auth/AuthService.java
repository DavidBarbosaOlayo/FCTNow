package com.fctnow.backend.auth;

import com.fctnow.backend.user.UserAccount;
import com.fctnow.backend.user.UserAccountRepository;
import java.util.Locale;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

  private final AuthenticationManager authenticationManager;
  private final JwtTokenService jwtTokenService;
  private final UserAccountRepository userAccountRepository;

  public AuthService(
      AuthenticationManager authenticationManager,
      JwtTokenService jwtTokenService,
      UserAccountRepository userAccountRepository) {
    this.authenticationManager = authenticationManager;
    this.jwtTokenService = jwtTokenService;
    this.userAccountRepository = userAccountRepository;
  }

  @Transactional(readOnly = true)
  public LoginResponse login(LoginRequest request) {
    String email = request.email().trim().toLowerCase(Locale.ROOT);

    authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(email, request.password()));

    UserAccount userAccount = userAccountRepository.findByEmailIgnoreCase(email)
        .orElseThrow();
    JwtTokenService.TokenDetails token = jwtTokenService.issueToken(userAccount);

    return new LoginResponse(
        "Bearer",
        token.accessToken(),
        token.expiresAt(),
        AuthenticatedUserResponse.from(userAccount));
  }
}
