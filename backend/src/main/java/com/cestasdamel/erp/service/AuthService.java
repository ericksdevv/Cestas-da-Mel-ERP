package com.cestasdamel.erp.service;

import com.cestasdamel.erp.config.JwtService;
import com.cestasdamel.erp.dto.Requests.Login;
import com.cestasdamel.erp.dto.Requests.Register;
import com.cestasdamel.erp.dto.Responses.Auth;
import com.cestasdamel.erp.dto.Responses.UserView;
import com.cestasdamel.erp.exception.BusinessException;
import com.cestasdamel.erp.model.Enums;
import com.cestasdamel.erp.model.User;
import com.cestasdamel.erp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service @RequiredArgsConstructor
public class AuthService {
    private final JwtService jwtService;
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    private final Map<String, LoginAttempt> loginAttempts = new ConcurrentHashMap<>();

    private record LoginAttempt(int count, Instant lastAttempt) {}

    @Transactional(readOnly = true)
    public Auth login(Login request) {
        String username = request.username().trim().toLowerCase();
        checkRateLimit(username);

        User user = users.findByUsernameIgnoreCase(username)
            .filter(User::isActive)
            .orElseThrow(() -> {
                recordFailedAttempt(username);
                return new BadCredentialsException("Credenciais inválidas");
            });

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            recordFailedAttempt(username);
            throw new BadCredentialsException("Credenciais inválidas");
        }

        loginAttempts.remove(username);
        return new Auth(jwtService.generate(user.getUsername()), "Bearer", jwtService.expirationSeconds(), user.getUsername());
    }

    private void checkRateLimit(String username) {
        LoginAttempt attempt = loginAttempts.get(username);
        if (attempt != null && attempt.count() >= 5) {
            if (Instant.now().isBefore(attempt.lastAttempt().plus(15, ChronoUnit.MINUTES))) {
                throw new BusinessException("Muitas tentativas falhas. Tente novamente em 15 minutos.");
            } else {
                loginAttempts.remove(username);
            }
        }
    }

    private void recordFailedAttempt(String username) {
        loginAttempts.compute(username, (k, v) -> {
            if (v == null || Instant.now().isAfter(v.lastAttempt().plus(15, ChronoUnit.MINUTES))) {
                return new LoginAttempt(1, Instant.now());
            }
            return new LoginAttempt(v.count() + 1, Instant.now());
        });
    }

    @Transactional
    public UserView setupFirstUser(Register request) {
        if (users.count() > 0) {
            throw new BusinessException("O sistema já possui usuários cadastrados. O setup inicial não é mais permitido.");
        }
        return createUser(request);
    }

    @Transactional
    public UserView register(Register request, Authentication authentication) {
        boolean authenticatedAdmin = authentication != null
            && authentication.isAuthenticated()
            && authentication.getAuthorities().stream().anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
        
        if (!authenticatedAdmin) {
            throw new AccessDeniedException("Somente um administrador autenticado pode criar novos acessos");
        }
        return createUser(request);
    }

    private UserView createUser(Register request) {
        String username = request.username().trim().toLowerCase();
        if (users.existsByUsernameIgnoreCase(username)) throw new BusinessException("Nome de usuário já cadastrado");
        User user = new User();
        user.setName(request.name().trim());
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Enums.UserRole.ADMIN);
        users.save(user);
        return view(user);
    }

    public UserView view(User user) { return new UserView(user.getId(), user.getName(), user.getUsername(), user.getRole(), user.isActive()); }
}
