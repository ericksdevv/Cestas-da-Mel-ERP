package com.cestasdamel.erp.controller;

import com.cestasdamel.erp.dto.Requests.Login;
import com.cestasdamel.erp.dto.Requests.Register;
import com.cestasdamel.erp.dto.Responses.Auth;
import com.cestasdamel.erp.dto.Responses.UserView;
import com.cestasdamel.erp.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    Auth login(@Valid @RequestBody Login request) {
        return authService.login(request);
    }

    @PostMapping("/setup")
    ResponseEntity<UserView> setup(@Valid @RequestBody Register request) {
        return ResponseEntity.status(201).body(authService.setupFirstUser(request));
    }

    @PostMapping("/register")
    ResponseEntity<UserView> register(@Valid @RequestBody Register request, Authentication authentication) {
        return ResponseEntity.status(201).body(authService.register(request, authentication));
    }
}
