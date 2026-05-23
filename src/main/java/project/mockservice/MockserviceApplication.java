package project.mockservice;


import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
@SpringBootApplication
@EnableMongoAuditing
public class MockserviceApplication {

    public static void main(String[] args) {
        SpringApplication.run(MockserviceApplication.class, args);
    }

}
