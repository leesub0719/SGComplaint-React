package com.transit.SGComplaint.controller;

import org.junit.jupiter.api.Test;
import org.springframework.security.web.csrf.CsrfToken;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CsrfTokenApiControllerTests {

    @Test
    void returnsHeaderAndFormParameterNames() {
        CsrfToken token = new CsrfToken() {
            @Override public String getHeaderName() { return "X-CSRF-TOKEN"; }
            @Override public String getParameterName() { return "_csrf"; }
            @Override public String getToken() { return "test-token"; }
        };

        Map<String, String> response = new CsrfTokenApiController().csrfToken(token);

        assertEquals("X-CSRF-TOKEN", response.get("headerName"));
        assertEquals("_csrf", response.get("parameterName"));
        assertEquals("test-token", response.get("token"));
    }
}
