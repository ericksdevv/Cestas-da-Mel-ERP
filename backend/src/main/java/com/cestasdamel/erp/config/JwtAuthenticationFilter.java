package com.cestasdamel.erp.config;

import com.cestasdamel.erp.repository.UserRepository;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component @RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtService jwtService;
    private final UserRepository users;

    @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain) throws ServletException,IOException {
        String authorization=request.getHeader("Authorization");
        if(authorization!=null&&authorization.startsWith("Bearer ")&&SecurityContextHolder.getContext().getAuthentication()==null){
            try{
                String username=jwtService.subject(authorization.substring(7));
                users.findByUsernameIgnoreCase(username).filter(u->u.isActive()).ifPresent(user->SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(user.getUsername(),null,List.of(new SimpleGrantedAuthority("ROLE_"+user.getRole().name())))
                ));
            }catch(RuntimeException ignored){ }
        }
        chain.doFilter(request,response);
    }
}
