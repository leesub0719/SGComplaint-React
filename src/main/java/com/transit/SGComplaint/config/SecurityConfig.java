package com.transit.SGComplaint.config;

import org.springframework.context.annotation.Bean;
import com.transit.SGComplaint.service.AbuseLimitService;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.rememberme.JdbcTokenRepositoryImpl;
import org.springframework.security.web.authentication.rememberme.PersistentTokenRepository;
import org.springframework.beans.factory.annotation.Value;

import javax.sql.DataSource;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            RoleBasedAuthenticationSuccessHandler successHandler,
            AbuseLimitService limits,
            PersistentTokenRepository persistentTokenRepository,
            UserDetailsService userDetailsService,
            @Value("${app.security.remember-me-key}") String rememberMeKey) throws Exception {
        http
            .addFilterBefore(new AuthenticationRateLimitFilter(limits), UsernamePasswordAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET,
                    "/complaints",
                    "/complaints/view/**",
                    "/api/public/complaints",
                    "/api/home",
                    "/api/notices/**",
                    "/api/routes/**",
                    "/notices/images/**"
                ).permitAll()
                .requestMatchers(HttpMethod.POST, "/complaints/*/verify").permitAll()
                .requestMatchers(
                    "/",
                    "/api/members/check-id",
                    "/api/account-recovery/**",
                    "/api/signup/**",
                    "/api/csrf",
                    // 헤더는 비로그인 상태에서도 그려야 하므로 공개한다.
                    // 로그인하지 않았으면 loggedIn:false 만 응답한다.
                    "/api/layout/me",
                    // 통합 SPA의 셸(index.html·JS·CSS)은 공개한다.
                    // 화면 안의 데이터는 전부 /api/** 를 거치고, 그쪽에서 권한을
                    // 검사하므로 셸만으로는 아무 정보도 노출되지 않는다.
                    "/app/**",
                    "/main-banners/**",
                    "/route-guide-images/**",
                    "/favicon.ico",
                    "/error"
                ).permitAll()
                .requestMatchers("/api/phone-verifications/**").authenticated()
                .requestMatchers("/api/admin/partners", "/api/admin/partners/**").hasRole("MASTER")
                .requestMatchers("/admin/**").hasAnyRole("ADMIN", "MASTER")
                // React 관리자 화면과 그 API도 기존 /admin/** 과 같은 권한으로 보호한다.
                .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "MASTER")
                .anyRequest().authenticated()
            )
            .formLogin(form -> form
                .loginPage("/app/login")
                .loginProcessingUrl("/login")
                .usernameParameter("empId")
                .passwordParameter("empPassword")
                .successHandler(successHandler)
                .failureUrl("/app/login?error")
                .permitAll()
            )
            .rememberMe(remember -> remember
                .rememberMeParameter("remember-me")
                .tokenRepository(persistentTokenRepository)
                .userDetailsService(userDetailsService)
                .key(rememberMeKey)
                .tokenValiditySeconds(60 * 60 * 24 * 14)
            )
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/app/?logout")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID", "remember-me")
            );

        return http.build();
    }

    @Bean
    public PersistentTokenRepository persistentTokenRepository(DataSource dataSource) {
        JdbcTokenRepositoryImpl repository = new JdbcTokenRepositoryImpl();
        repository.setDataSource(dataSource);
        return repository;
    }
}
