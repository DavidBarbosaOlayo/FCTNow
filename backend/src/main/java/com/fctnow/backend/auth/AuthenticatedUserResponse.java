package com.fctnow.backend.auth;

import com.fctnow.backend.user.UserAccount;
import com.fctnow.backend.user.UserRole;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.security.oauth2.jwt.Jwt;

public record AuthenticatedUserResponse(
    Long id,
    String email,
    String displayName,
    Set<UserRole> roles) {

  public static AuthenticatedUserResponse from(UserAccount userAccount) {
    return new AuthenticatedUserResponse(
        userAccount.getId(),
        userAccount.getEmail(),
        userAccount.getDisplayName(),
        orderedRoles(userAccount.getRoles()));
  }

  public static AuthenticatedUserResponse from(Jwt jwt) {
    return new AuthenticatedUserResponse(
        jwt.getClaim("user_id"),
        jwt.getSubject(),
        jwt.getClaimAsString("display_name"),
        rolesFromClaim(jwt.getClaimAsStringList("roles")));
  }

  private static Set<UserRole> rolesFromClaim(List<String> roles) {
    if (roles == null) {
      return Set.of();
    }

    return roles.stream()
        .map(UserRole::valueOf)
        .collect(Collectors.toCollection(LinkedHashSet::new));
  }

  private static Set<UserRole> orderedRoles(Set<UserRole> roles) {
    return roles.stream()
        .sorted(Comparator.comparing(Enum::name))
        .collect(Collectors.toCollection(LinkedHashSet::new));
  }
}
