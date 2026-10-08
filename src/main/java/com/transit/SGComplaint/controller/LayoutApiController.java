package com.transit.SGComplaint.controller;

import com.transit.SGComplaint.service.EmployeeService;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * React 화면의 공통 헤더가 쓰는 로그인 상태 API.
 *
 * <p>로그인 상태와 사용자 이름, 관리자 여부를 JSON으로 제공한다.</p>
 *
 * <p>정적 파일로 서빙되는 SPA에는 그 Model이 없다. 같은 판정 로직을 JSON으로
 * 내려줘서 React 헤더가 동일하게 동작하도록 한다.</p>
 *
 * <p>비로그인 상태에서도 헤더를 그려야 하므로 이 엔드포인트는 인증 없이 접근할 수
 * 있고, 로그인하지 않았으면 {@code loggedIn: false}만 돌려준다.</p>
 */
@RestController
public class LayoutApiController {

    private final EmployeeService employeeService;

    public LayoutApiController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping("/api/layout/me")
    public LayoutMember me(Authentication authentication) {
        boolean loggedIn = authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken);

        if (!loggedIn) {
            return new LayoutMember(false, null, false);
        }

        boolean hasAdminAuthority = authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority())
                        || "ROLE_MASTER".equals(authority.getAuthority()));

        return new LayoutMember(
                true,
                employeeService.getActiveEmployeeName(authentication.getName()),
                hasAdminAuthority
                        && employeeService.isActiveAdministrator(authentication.getName()));
    }

    public record LayoutMember(boolean loggedIn, String memberName, boolean admin) {
    }
}
