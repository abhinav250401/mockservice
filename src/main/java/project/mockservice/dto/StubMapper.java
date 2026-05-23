package project.mockservice.dto;

import com.github.tomakehurst.wiremock.client.MappingBuilder;
import com.github.tomakehurst.wiremock.client.ResponseDefinitionBuilder;
import com.github.tomakehurst.wiremock.client.WireMock;
import com.github.tomakehurst.wiremock.stubbing.Scenario;
import com.github.tomakehurst.wiremock.stubbing.StubMapping;
import org.springframework.stereotype.Component;
import project.mockservice.entity.Stubs;
import project.mockservice.enums.StubStatus;

import java.util.UUID;

import static com.github.tomakehurst.wiremock.client.WireMock.*;

@Component
public class StubMapper {

    public StubDTO toDTO(Stubs doc) {
        return StubDTO.builder()
                .id(doc.getId())
                .wiremockMappingId(doc.getWiremockMappingId())
                .name(doc.getName())
                .method(doc.getMethod())
                .urlPath(doc.getUrlPath())
                .urlMatchType(doc.getUrlMatchType())
                .status(doc.getStatus())
                .responseStatus(doc.getResponseStatus())
                .reqBody(doc.getReqBody())
                .responseBody(doc.getResponseBody())
                .contentType(doc.getContentType())
                .delayMillis(doc.getDelayMillis())
                .createdAt(doc.getCreatedAt() != null ? doc.getCreatedAt().toString() : null)
                .updatedAt(doc.getUpdatedAt() != null ? doc.getUpdatedAt().toString() : null)
                .scenarioName(doc.getScenarioName())
                .requiredScenarioState(doc.getRequiredScenarioState())
                .newScenarioState(doc.getNewScenarioState())
                .reqHeaders(doc.getReqHeaders())
                .respHeaders(doc.getRespHeaders())
                .build();
    }

    public Stubs toDocument(StubDTO dto) {
        Stubs doc = new Stubs();
        doc.setName(dto.getName());
        doc.setMethod(dto.getMethod().toUpperCase());
        doc.setUrlPath(dto.getUrlPath());
        doc.setUrlMatchType(dto.getUrlMatchType() != null ? dto.getUrlMatchType() : "EXACT");
        doc.setStatus(dto.getStatus() != null ? dto.getStatus() : StubStatus.ACTIVE);
        doc.setResponseStatus(dto.getResponseStatus() > 0 ? dto.getResponseStatus() : 200);
        doc.setResponseBody(dto.getResponseBody());
        doc.setContentType(dto.getContentType() != null ? dto.getContentType() : "application/json");
        doc.setDelayMillis(dto.getDelayMillis());
        doc.setReqBody(dto.getReqBody());
        doc.setScenarioName(dto.getScenarioName());
        doc.setRequiredScenarioState(dto.getRequiredScenarioState());
        doc.setNewScenarioState(dto.getNewScenarioState());
        return doc;
    }
    
    public StubMapping toWireMockMapping(Stubs doc) {

        ResponseDefinitionBuilder responseBuilder = aResponse()
                .withStatus(doc.getResponseStatus())
                .withHeader("Content-Type", doc.getContentType());

        if (doc.getResponseBody() != null && !doc.getResponseBody().isBlank()) {
            responseBuilder.withBody(doc.getResponseBody());
        }

        if (doc.getDelayMillis() > 0) {
            responseBuilder.withFixedDelay(doc.getDelayMillis());
        }
        MappingBuilder mappingBuilder = buildMappingBuilder(doc);
        StubMapping mapping = mappingBuilder
                .willReturn(responseBuilder)
                .build();
        if (doc.getReqBody() != null && !doc.getReqBody().isBlank()) {
            mappingBuilder.withRequestBody(equalToJson(doc.getReqBody(), true, false));
        }
        if (doc.getScenarioName() != null && !doc.getScenarioName().isBlank()) {
            mapping.setScenarioName(doc.getScenarioName());
            String requiredState = (doc.getRequiredScenarioState() != null && !doc.getRequiredScenarioState().isBlank())
                    ? doc.getRequiredScenarioState()
                    : Scenario.STARTED;

            mapping.setRequiredScenarioState(requiredState);
            if (doc.getNewScenarioState() != null && !doc.getNewScenarioState().isBlank()) {
                mapping.setNewScenarioState(doc.getNewScenarioState());
            }
        }
        if (doc.getWiremockMappingId() != null) {
            mapping.setId(UUID.fromString(doc.getWiremockMappingId()));
        }
        return mapping;

    }
    private MappingBuilder buildMappingBuilder(Stubs doc) {
        return switch (doc.getUrlMatchType()) {

            case "PATTERN" ->
                    WireMock.request(doc.getMethod(), urlMatching(doc.getUrlPath()));

            case "PREFIX" ->
                    WireMock.request(doc.getMethod(), urlPathMatching(doc.getUrlPath() + ".*"));

            default ->
                    WireMock.request(doc.getMethod(), urlEqualTo(doc.getUrlPath()));
        };
    }
}
