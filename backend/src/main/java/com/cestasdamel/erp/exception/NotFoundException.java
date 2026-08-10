package com.cestasdamel.erp.exception; public class NotFoundException extends RuntimeException { public NotFoundException(String resource,Long id){super(resource+" não encontrado(a): "+id);} }
