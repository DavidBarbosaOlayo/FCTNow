package com.fctnow.backend.auth;

import com.fctnow.backend.config.JwtProperties;
import com.fctnow.backend.user.UserAccount;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

@Service
public class JwtTokenService {

  private final JwtEncoder jwtEncoder;
  private final JwtProperties jwtProperties;

  public JwtTokenService(JwtEncoder jwtEncoder, JwtProperties jwtProperties) {
    this.jwtEncoder = jwtEncoder;
    this.jwtProperties = jwtProperties;
  }

  public TokenDetails issueToken(UserAccount userAccount) {
    Instant issuedAt = Instant.now();
    Instant expiresAt = issuedAt.plus(jwtProperties.expiration());
    List<String> roles = userAccount.getRoles().stream()
        .sorted(Comparator.comparing(Enum::name))
        .map(Enum::name)
        .toList();

    JwtClaimsSet.Builder builder = JwtClaimsSet.builder()
        .issuer(jwtProperties.issuer())
        .issuedAt(issuedAt)
        .expiresAt(expiresAt)
        .subject(userAccount.getEmail())
        .claim("user_id", userAccount.getId())
        .claim("display_name", userAccount.getDisplayName())
        .claim("roles", roles);
    if (userAccount.getCentroEmail() != null) {
      builder.claim("centro_email", userAccount.getCentroEmail());
    }
    JwtClaimsSet claims = builder.build();

    String accessToken = jwtEncoder.encode(JwtEncoderParameters.from(
        JwsHeader.with(MacAlgorithm.HS256).build(),
        claims))
        .getTokenValue();

    return new TokenDetails(accessToken, expiresAt);
  }

  public record TokenDetails(String accessToken, Instant expiresAt) {
  }
}
