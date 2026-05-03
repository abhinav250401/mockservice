package project.mockservice;

import org.hibernate.annotations.processing.Exclude;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration;

@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)
public class MockserviceApplication {

    public static void main(String[] args) {
        SpringApplication.run(MockserviceApplication.class, args);
    }

}
