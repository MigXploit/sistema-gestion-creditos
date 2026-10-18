package com.umsa.creditos.infraestructura.config;

public class BusinessException extends RuntimeException {
    public BusinessException(String message) {
        super(message);
    }
}
