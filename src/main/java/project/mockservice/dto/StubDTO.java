package project.mockservice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import project.mockservice.enums.StubStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StubDTO {
    private String id;

    private String wiremockMappingId;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Method is required")
    @Pattern(
            regexp = "GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD",
            message = "Method must be a valid HTTP verb"
    )
    private String method;

    @NotBlank(message = "URL path is required")
    @Pattern(
            regexp = "^/.*",
            message = "URL path must start with /"
    )
    private String urlPath;

    @Pattern(
            regexp = "EXACT|PATTERN|PREFIX",
            message = "urlMatchType must be EXACT, PATTERN, or PREFIX"
    )
    private String urlMatchType;

    private StubStatus status;

    private String reqBody;

    @Min(value = 100, message = "Response status must be a valid HTTP code")
    @Max(value = 599, message = "Response status must be a valid HTTP code")
    private int responseStatus;

    private String responseBody;

    private String contentType;

    @Min(value = 0, message = "Delay cannot be negative")
    @Max(value = 30000, message = "Delay cannot exceed 30 seconds")
    private int delayMillis;

    private String createdAt;
    private String updatedAt;

    private String reqHeaders;
    private String respHeaders;

    private String scenarioName;
    private String requiredScenarioState;
    private String newScenarioState;
}
