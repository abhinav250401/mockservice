package project.mockservice.controller;

import com.github.tomakehurst.wiremock.WireMockServer;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RequestMapping(value = "/health")
@RestController
@CrossOrigin(allowedHeaders = "*")
@RequiredArgsConstructor
public class HealthController {

    private final WireMockServer wireMockServer;
    @GetMapping("/status")
    public ResponseEntity<?> healthCheck() {
        Map<String, Object> statusMap = new HashMap<>();
        boolean isRunning = wireMockServer != null && wireMockServer.isRunning();

        if (isRunning) {
            statusMap.put("status", "UP");
            statusMap.put("wiremockPort", wireMockServer.port());
            statusMap.put("message", "WireMock server is active and listening for stubs.");
            return ResponseEntity.ok(statusMap);
        } else {
            statusMap.put("status", "DOWN");
            statusMap.put("message", "WireMock server is stopped or uninitialized.");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(statusMap);
        }
    }

    @PostMapping("/start")
    public ResponseEntity<?> startServer() {
        Map<String, Object> response = new HashMap<>();
        if (!wireMockServer.isRunning()) {
            wireMockServer.start();
            response.put("status", "UP");
            response.put("message", "WireMock server started successfully.");
            return ResponseEntity.ok(response);
        }
        response.put("status", "UP");
        response.put("message", "WireMock server is already running.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/stop")
    public ResponseEntity<?> stopServer() {
        Map<String, Object> response = new HashMap<>();
        if (wireMockServer.isRunning()) {
            wireMockServer.stop();
            response.put("status", "DOWN");
            response.put("message", "WireMock server stopped successfully.");
            return ResponseEntity.ok(response);
        }
        response.put("status", "DOWN");
        response.put("message", "WireMock server is already stopped.");
        return ResponseEntity.ok(response);
    }
}
