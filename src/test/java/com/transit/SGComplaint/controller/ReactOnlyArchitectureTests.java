package com.transit.SGComplaint.controller;

import org.junit.jupiter.api.Test;
import java.nio.file.*;
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
}
