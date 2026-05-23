package project.mockservice.entity;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import project.mockservice.enums.StubStatus;

import java.time.Instant;

@Document(collection = "stubs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Stubs {

    @Id
    private String id;

    private String wiremockMappingId;

    @Indexed
    private String name;

    private String method;

    @Indexed
    private String urlPath;

    private String urlMatchType;

    @Indexed
    private StubStatus status;

    private int responseStatus;

    private String reqBody;
    private String responseBody;


    private String contentType;

    private int delayMillis;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    private String respHeaders;
    private String reqHeaders;

    private String scenarioName;
    private String requiredScenarioState;
    private String newScenarioState;

}
