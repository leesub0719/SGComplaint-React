package com.transit.SGComplaint.controller;

import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.util.pattern.PathPatternParser;
import org.springframework.http.server.PathContainer;
import java.nio.file.*;
import java.util.Arrays;
import static org.junit.jupiter.api.Assertions.*;

class ReactOnlyArchitectureTests {
    @Test void serverRenderedTemplatesAreNotPresent() {
        assertFalse(Files.exists(Path.of("src/main/resources/templates")));
    }

    @Test void singleReactApplicationExists() {
        assertTrue(Files.exists(Path.of("frontend/sgcomplaint-web/src/App.jsx")));
        assertTrue(Files.exists(Path.of("frontend/sgcomplaint-web/src/pages/admin/Notices.jsx")));
        assertTrue(Files.exists(Path.of("frontend/sgcomplaint-web/src/pages/notices/List.jsx")));
    }

    @Test void spaForwardDoesNotInterceptItsOwnIndexFile() throws Exception {
        GetMapping mapping = ReactAppController.class.getMethod("app").getAnnotation(GetMapping.class);
        PathPatternParser parser = new PathPatternParser();

        boolean interceptsIndex = Arrays.stream(mapping.value())
                .map(parser::parse)
                .anyMatch(pattern -> pattern.matches(PathContainer.parsePath("/app/index.html")));
        boolean handlesReactRoute = Arrays.stream(mapping.value())
                .map(parser::parse)
                .anyMatch(pattern -> pattern.matches(PathContainer.parsePath("/app/admin/dashboard")));

        assertFalse(interceptsIndex);
        assertTrue(handlesReactRoute);
    }
}
