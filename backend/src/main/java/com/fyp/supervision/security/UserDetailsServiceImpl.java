package com.fyp.supervision.security;

import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserAccountRepository userAccountRepository;

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        UserAccount user = userAccountRepository.findByEmailOrMmuId(identifier)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with identifier: " + identifier));

        return buildUserDetails(user);
    }

    public UserDetails loadUserById(Long userId) {
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));

        return buildUserDetails(user);
    }

    private UserDetails buildUserDetails(UserAccount user) {
        return new User(
                user.getUserId().toString(),
                user.getPasswordHash(),
                user.getStatus().name().equals("ACTIVE"),
                true, true, true,
                Collections.singletonList(new SimpleGrantedAuthority(user.getRole().name()))
        );
    }
}
