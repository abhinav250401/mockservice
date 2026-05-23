package project.mockservice.config;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.client.WireMock;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import static com.github.tomakehurst.wiremock.core.WireMockConfiguration.options;

@Configuration
public class WireMockConfig {
    @Value("${wiremock.server.host}")
    private String host;

    @Value("${wiremock.server.port}")
    private int port;

    @Bean(initMethod = "start", destroyMethod = "stop")
    public WireMockServer wireMockServer() {
        return new WireMockServer(options()
                .bindAddress(host)
                .port(port));
    }

    @Bean
    public WireMock wireMockClient(WireMockServer wireMockServer) {
        WireMock.configureFor(host, port);
        return new WireMock(host, port);
    }
}
