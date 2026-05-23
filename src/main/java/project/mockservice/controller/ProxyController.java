package project.mockservice.controller;


import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Enumeration;
import java.util.List;

@RestController
public class ProxyController {

        private final RestTemplate restTemplate = new RestTemplate();
        private final String WIREMOCK_BASE_URL = "http://localhost:8089";
        @RequestMapping("/mock/**")
        public ResponseEntity<?> proxyRequest(HttpServletRequest request) throws URISyntaxException, IOException {
            String requestUrl = request.getRequestURI();
            String wireMockPath = requestUrl.replaceFirst("^/mock-studio/mock", "");
            String queryString = request.getQueryString();
            String targetUrl = WIREMOCK_BASE_URL + wireMockPath + (queryString != null ? "?" + queryString : "");
            HttpHeaders headers = new HttpHeaders();
            Enumeration<String> headerNames = request.getHeaderNames();
            while (headerNames.hasMoreElements()) {
                String headerName = headerNames.nextElement();
                if (!headerName.equalsIgnoreCase("host")) {
                    headers.add(headerName, request.getHeader(headerName));
                }
            }
            byte[] body = request.getInputStream().readAllBytes();
            HttpEntity<byte[]> httpEntity = new HttpEntity<>(body, headers);
            try {
                ResponseEntity<?> response =  restTemplate.exchange(
                        new URI(targetUrl),
                        HttpMethod.valueOf(request.getMethod()),
                        httpEntity,
                        byte[].class
                );
                return ResponseEntity
                        .status(response.getStatusCode())
                        .headers(sanitizeResponseHeaders(response.getHeaders()))
                        .body(response.getBody());
            } catch (HttpStatusCodeException e) {
                assert e.getResponseHeaders() != null;
                return ResponseEntity
                        .status(e.getStatusCode())
                        .headers(sanitizeResponseHeaders(e.getResponseHeaders()))
                        .body(e.getResponseBodyAsByteArray());
            }
        }
    private HttpHeaders sanitizeResponseHeaders(HttpHeaders originalHeaders) {
        HttpHeaders sanitizedHeaders = new HttpHeaders();

        List<String> hopByHopHeaders = java.util.Arrays.asList(
                "transfer-encoding",
                "content-length",
                "connection",
                "keep-alive",
                "proxy-authenticate",
                "proxy-authorization",
                "te",
                "trailers",
                "upgrade"
        );

        originalHeaders.forEach((key, values) -> {
            if (!hopByHopHeaders.contains(key.toLowerCase())) {
                sanitizedHeaders.put(key, values);
            }
        });

        return sanitizedHeaders;
    }
    }

