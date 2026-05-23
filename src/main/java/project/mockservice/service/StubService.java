package project.mockservice.service;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.client.WireMock;
import com.github.tomakehurst.wiremock.stubbing.StubMapping;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import project.mockservice.dto.StubDTO;
import project.mockservice.dto.StubMapper;
import project.mockservice.entity.Stubs;
import project.mockservice.enums.StubStatus;
import project.mockservice.repository.StubRepository;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StubService {

    private final StubRepository stubRepository;
    private final WireMock wireMockClient;
    private final WireMockServer wireMockServer;
    private final StubMapper stubMapper;

    public void createStub(StubDTO stubDTO) {
        Stubs entity = stubMapper.toDocument(stubDTO);

        if (entity.getWiremockMappingId() == null) {
            entity.setWiremockMappingId(UUID.randomUUID().toString());
        }

        if (entity.getStatus() == null) {
            entity.setStatus(StubStatus.ACTIVE);
        }

        Stubs savedEntity = stubRepository.save(entity);
        log.info("Saved stub to MongoDB with ID: {}", savedEntity.getId());

        if (wireMockServer.isRunning() && savedEntity.getStatus() == StubStatus.ACTIVE) {
            try {
                StubMapping wiremockMapping = stubMapper.toWireMockMapping(savedEntity);
                wiremockMapping.setId(UUID.fromString(savedEntity.getWiremockMappingId()));
                wireMockClient.register(wiremockMapping);
                log.info("Successfully registered stub in active WireMock registry.");
            } catch (Exception e) {
                log.warn("Stub saved to Mongo, but failed immediate WireMock registration. Reason: {}", e.getMessage());
            }
        }
    }

    public void updateStubStatus(String id, StubStatus newStatus) {
        Stubs entity = stubRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Stub not found with ID: " + id));
        entity.setStatus(newStatus);
        stubRepository.save(entity);
        log.info("Stub {} status updated to {} in MongoDB", id, newStatus);
        if (!wireMockServer.isRunning()) {
            log.warn("WireMock is currently DOWN. Status updated in DB, but registry was not modified.");
            return;
        }

        StubMapping wiremockMapping = stubMapper.toWireMockMapping(entity);
        wiremockMapping.setId(UUID.fromString(entity.getWiremockMappingId()));
        try {
            if (newStatus == StubStatus.ACTIVE) {
                wireMockClient.register(wiremockMapping);
                log.info("Stub immediately activated in WireMock registry.");
            } else if (newStatus == StubStatus.INACTIVE) {
                wireMockServer.removeStubMapping(wiremockMapping);
                log.info("Stub immediately removed from WireMock registry.");
            }
        } catch (Exception e) {
            log.error("Failed to sync stub status with WireMock registry", e);
            throw new RuntimeException("Database updated, but failed to sync with WireMock: " + e.getMessage());
        }
    }

    public List<StubDTO> getAllStubs() {
        return stubRepository.findAll()
                .stream()
                .map(stubMapper::toDTO)
                .collect(Collectors.toList());
    }


    public void deleteStub(String id) {
        Stubs entity = stubRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Stub not found with ID: " + id));

        stubRepository.deleteById(id);
        log.info("Successfully deleted stub with ID: {} from MongoDB", id);

        if (wireMockServer.isRunning()) {
            try {
                StubMapping wiremockMapping = stubMapper.toWireMockMapping(entity);
                wiremockMapping.setId(UUID.fromString(entity.getWiremockMappingId()));

                wireMockServer.removeStubMapping(wiremockMapping);
                log.info("Successfully removed stub from WireMock registry.");
            } catch (Exception e) {
                log.warn("Stub deleted from Mongo, but failed to remove from WireMock registry: {}", e.getMessage());
            }
        }
    }

    public void updateStub(String id, StubDTO stubDTO) {
        Stubs existingEntity = stubRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Stub not found with ID: " + id));
        Stubs updatedEntity = stubMapper.toDocument(stubDTO);


        updatedEntity.setId(existingEntity.getId());
        updatedEntity.setWiremockMappingId(existingEntity.getWiremockMappingId());
        updatedEntity.setCreatedAt(existingEntity.getCreatedAt());


        if (updatedEntity.getStatus() == null) {
            updatedEntity.setStatus(existingEntity.getStatus());
        }


        Stubs savedEntity = stubRepository.save(updatedEntity);
        log.info("Successfully updated stub in MongoDB with ID: {}", savedEntity.getId());

        if (wireMockServer.isRunning()) {
            try {
                // Map to WireMock format and strictly enforce the existing UUID
                StubMapping wiremockMapping = stubMapper.toWireMockMapping(savedEntity);
                wiremockMapping.setId(UUID.fromString(savedEntity.getWiremockMappingId()));

                if (savedEntity.getStatus() == StubStatus.ACTIVE) {
                    // Because the UUID matches an existing stub, register() acts as an UPDATE.
                    wireMockClient.register(wiremockMapping);
                    log.info("Successfully updated stub in WireMock registry.");
                } else {
                    // Edge case: User updated the stub but also set it to INACTIVE
                    wireMockServer.removeStubMapping(wiremockMapping);
                    log.info("Stub updated but marked INACTIVE. Removed from WireMock registry.");
                }
            } catch (Exception e) {
                log.warn("Stub updated in Mongo, but failed to sync with WireMock registry: {}", e.getMessage());
            }
        }


        return;
    }
}
