package com.cestasdamel.erp.exception;
import org.springframework.http.*; import org.springframework.security.authentication.BadCredentialsException; import org.springframework.web.bind.MethodArgumentNotValidException; import org.springframework.web.bind.annotation.*; import jakarta.servlet.http.HttpServletRequest; import java.time.Instant; import java.util.*;
@RestControllerAdvice
public class GlobalExceptionHandler {
 public record ApiError(Instant timestamp,int status,String error,String message,String path,Map<String,String> fields){}
 @ExceptionHandler(NotFoundException.class) ResponseEntity<ApiError> notFound(NotFoundException e,HttpServletRequest r){return error(HttpStatus.NOT_FOUND,e.getMessage(),r,Map.of());}
 @ExceptionHandler({BusinessException.class,IllegalArgumentException.class}) ResponseEntity<ApiError> business(RuntimeException e,HttpServletRequest r){return error(HttpStatus.UNPROCESSABLE_ENTITY,e.getMessage(),r,Map.of());}
 @ExceptionHandler(BadCredentialsException.class) ResponseEntity<ApiError> credentials(Exception e,HttpServletRequest r){return error(HttpStatus.UNAUTHORIZED,"E-mail ou senha inválidos",r,Map.of());}
 @ExceptionHandler(MethodArgumentNotValidException.class) ResponseEntity<ApiError> validation(MethodArgumentNotValidException e,HttpServletRequest r){Map<String,String> f=new LinkedHashMap<>(); e.getBindingResult().getFieldErrors().forEach(x->f.putIfAbsent(x.getField(),x.getDefaultMessage())); return error(HttpStatus.BAD_REQUEST,"Dados inválidos",r,f);}
 @ExceptionHandler(Exception.class) ResponseEntity<ApiError> unexpected(Exception e,HttpServletRequest r){return error(HttpStatus.INTERNAL_SERVER_ERROR,"Erro interno inesperado",r,Map.of());}
 private ResponseEntity<ApiError> error(HttpStatus s,String m,HttpServletRequest r,Map<String,String> f){return ResponseEntity.status(s).body(new ApiError(Instant.now(),s.value(),s.getReasonPhrase(),m,r.getRequestURI(),f));}
}
