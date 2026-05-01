package com.fctnow.backend.user;

import java.util.Comparator;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserAccountDetailsService implements UserDetailsService {

  private final UserAccountRepository userAccountRepository;

  public UserAccountDetailsService(UserAccountRepository userAccountRepository) {
    this.userAccountRepository = userAccountRepository;
  }

  @Override
  public UserDetails loadUserByUsername(String username) {
    UserAccount userAccount = userAccountRepository.findByEmailIgnoreCase(username)
        .orElseThrow(() -> new UsernameNotFoundException("User not found"));

    String[] authorities = userAccount.getRoles().stream()
        .sorted(Comparator.comparing(Enum::name))
        .map(role -> "ROLE_" + role.name())
        .toArray(String[]::new);

    return User.withUsername(userAccount.getEmail())
        .password(userAccount.getPasswordHash())
        .disabled(!userAccount.isEnabled())
        .authorities(authorities)
        .build();
  }
}
