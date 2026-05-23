package project.mockservice.service;

import com.github.tomakehurst.wiremock.client.WireMock;
import com.github.tomakehurst.wiremock.stubbing.StubMapping;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Service;
import project.mockservice.dto.StubMapper;
import project.mockservice.entity.Stubs;
import project.mockservice.repository.StubRepository;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class BootstrapService implements ApplicationListener<ApplicationReadyEvent> {

    private final WireMock wireMockClient;
    private final StubRepository stubRepository;
    private final StubMapper stubMapper;
    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        log.info("=================================================");
        log.info("Mock Studio — Bootstrap starting");
        log.info("=================================================");

        try{
            log.info("================ Clearing WIREMOCK Registry ===================");
            WireMock.reset();
            List<Stubs> stubs = stubRepository.findAll();
            log.info("========= Count of stubs ============ :: {}", stubs.size());
            if(stubs.isEmpty()){
                log.info("============= No stubs found in database =============");
            }
            int successCount = 0;
            int failureCount = 0;
            for(Stubs stub : stubs){
                try{
                    StubMapping stubMapping = stubMapper.toWireMockMapping(stub);
                    wireMockClient.register(stubMapping);
                    successCount++;

                }
                catch(Exception e){
                    log.error(" >>>>>>>>>>>>>>> Exception occurred while registering stubs in wiremock registry! <<<<<<<<<<<<<<<<<<<", e);
                    failureCount++;
                }
            }
            log.info("============ Success count =========== :: {}", successCount);
            log.info("============= Failure count =========== :: {}", failureCount);

        }
        catch (Exception e){
            log.error("BootStrap Failed ====== Wiremock may be unreachable ======",e);
        }
    }
}
