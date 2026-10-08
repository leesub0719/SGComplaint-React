package com.transit.SGComplaint.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * 통합 React 앱(SPA) 진입점.
 *
 * <p>빌드 산출물은 {@code static/app}이며 모든 화면 경로를 SPA로 전달한다.</p>
 *
 * <p>react-router는 클라이언트에서 경로를 처리하므로, 사용자가 {@code /app/mypage}를
 * 주소창에 직접 입력하거나 새로고침하면 서버로 그 경로 요청이 온다. 그때도 같은
 * index.html을 돌려줘야 앱이 뜬다.</p>
 *
 * <p>매핑 패턴의 {@code [^\.]*}는 점이 없는 경로만 잡는다는 뜻이다. 이렇게 하면
 * {@code /app/assets/index-abc123.js} 같은 정적 파일 요청은 이 컨트롤러가 가로채지
 * 않고 정적 리소스 핸들러가 처리한다. 이 조건이 없으면 JS/CSS 요청까지 index.html을
 * 받아 앱이 통째로 깨진다.</p>
 */
@Controller
public class ReactAppController {

    @GetMapping({
            "/",
            "/app",
            "/app/",
            "/app/{*path}"
    })
    public String app() {
        return "forward:/app/index.html";
    }
}
