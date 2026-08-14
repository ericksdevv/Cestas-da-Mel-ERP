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

@Service @RequiredArgsConstructor
public class AuthService {
    private final JwtService jwtService;
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public Auth login(Login request) {
        User user = users.findByUsernameIgnoreCase(request.username().trim())
            .filter(User::isActive)
            .orElseThrow(() -> new BadCredentialsException("Credenciais inválidas"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Credenciais inválidas");
        }
        return new Auth(jwtService.generate(user.getUsername()), "Bearer", jwtService.expirationSeconds(), user.getUsername());
    }

    @Transactional
    public UserView register(Register request, Authentication authentication) {
        boolean firstUser = users.count() == 0;
        boolean authenticatedAdmin = authentication != null
            && authentication.isAuthenticated()
            && authentication.getAuthorities().stream().anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
        if (!firstUser && !authenticatedAdmin) {
            throw new AccessDeniedException("Somente um administrador autenticado pode criar novos acessos");
        }
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
