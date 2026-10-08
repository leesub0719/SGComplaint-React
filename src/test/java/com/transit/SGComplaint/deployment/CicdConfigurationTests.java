package com.transit.SGComplaint.deployment;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

class CicdConfigurationTests {

    private final Path root = Path.of(System.getProperty("user.dir"));

    @Test
    void ciBuildsAndPublishesExecutableJar() throws IOException {
        String workflow = read(".github/workflows/ci.yml");
        assertTrue(workflow.contains("clean test bootJar"));
        assertTrue(workflow.contains("actions/upload-artifact@v4"));
        assertTrue(workflow.contains("artifact/sgcomplaint.jar"));
    }

    @Test
    void productionDeploymentIsManualAndUsesProtectedRunner() throws IOException {
        String workflow = read(".github/workflows/deploy-production.yml");
        assertTrue(workflow.contains("workflow_dispatch:"));
        assertTrue(workflow.contains("environment: production"));
        assertTrue(workflow.contains("sgcomplaint-prod"));
        assertTrue(workflow.contains("sudo /usr/local/sbin/sgcomplaint-deploy"));
        assertFalse(workflow.contains("DB_PASSWORD"));
    }

    @Test
    void deploymentUsesFixedPathsMigrationValidationHealthAndRollback() throws IOException {
        String script = read("deploy/sgcomplaint-deploy");
        assertTrue(script.contains("/opt/sgcomplaint/incoming/sgcomplaint.jar"));
        assertTrue(script.contains("bash \"$migration_script\" migrate"));
        assertTrue(script.contains("bash \"$migration_script\" validate"));
        assertTrue(script.indexOf("bash \"$migration_script\" migrate")
                < script.indexOf("bash \"$migration_script\" validate"));
        assertTrue(script.contains("127.0.0.1:9081/actuator/health"));
        assertTrue(script.contains("rollback_jar"));
        assertFalse(script.contains("eval "));
        assertFalse(script.contains("source "));
    }

    @Test
    void smsCredentialsComeOnlyFromEnvironment() throws IOException {
        for (String profile : new String[]{"local", "prod"}) {
            String properties = read("src/main/resources/application-" + profile + ".properties");
            assertTrue(properties.contains("sms.solapi.api-key=${SOLAPI_API_KEY"));
            assertTrue(properties.contains("sms.solapi.api-secret=${SOLAPI_API_SECRET"));
            assertTrue(properties.contains("sms.solapi.sender=${SOLAPI_SENDER"));
        }
    }

    private String read(String relativePath) throws IOException {
        return Files.readString(root.resolve(relativePath));
    }
}
