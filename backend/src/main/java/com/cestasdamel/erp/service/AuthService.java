package com.cestasdamel.erp.service;
import com.cestasdamel.erp.config.JwtService; import com.cestasdamel.erp.dto.Requests.*; import com.cestasdamel.erp.dto.Responses.*; import com.cestasdamel.erp.exception.BusinessException; import com.cestasdamel.erp.model.User; import com.cestasdamel.erp.repository.UserRepository; import lombok.RequiredArgsConstructor; import org.springframework.security.authentication.BadCredentialsException; import org.springframework.security.crypto.password.PasswordEncoder; import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional;
@Service @RequiredArgsConstructor
public class AuthService { private final UserRepository users; private final PasswordEncoder encoder; private final JwtService jwt;
 @Transactional public Auth register(Register r){if(users.existsByEmailIgnoreCase(r.email()))throw new BusinessException("E-mail já cadastrado");User u=new User();u.setName(r.name());u.setEmail(r.email().trim().toLowerCase());u.setPasswordHash(encoder.encode(r.password()));users.save(u);return auth(u);}
 public Auth login(Login r){User u=users.findByEmailIgnoreCase(r.email()).filter(User::isActive).orElseThrow(()->new BadCredentialsException("invalid"));if(!encoder.matches(r.password(),u.getPasswordHash()))throw new BadCredentialsException("invalid");return auth(u);}
 private Auth auth(User u){return new Auth(jwt.generate(u.getEmail()),"Bearer",jwt.expirationSeconds(),new UserView(u.getId(),u.getName(),u.getEmail(),u.isActive()));}
}
