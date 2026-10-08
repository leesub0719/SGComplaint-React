package com.transit.SGComplaint.controller;

import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * React 화면용 CSRF 토큰 발급 엔드포인트.
 *
 * <p>React SPA는 마운트 시 이 엔드포인트를 한 번 호출해
 * 헤더 이름과 토큰을 받아 이후 POST 요청 헤더에 붙인다.</p>
 *
 * <p>대안으로 {@code CookieCsrfTokenRepository.withHttpOnlyFalse()}를 쓰면
 * XSRF-TOKEN 쿠키로 받을 수 있지만, 그 방식은 앱 전역 설정을 바꾸므로
 * 기존 폼 화면 영향이 없는 이 방식을 택했다.</p>
 */
@RestController
public class CsrfTokenApiController {

    @GetMapping("/api/csrf")
    public Map<String, String> csrfToken(CsrfToken token) {
        return Map.of(
                "headerName", token.getHeaderName(),
                "parameterName", token.getParameterName(),
                "token", token.getToken());
    }
}
