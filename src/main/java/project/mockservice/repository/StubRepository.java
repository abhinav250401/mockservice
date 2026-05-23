package project.mockservice.repository;


import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import project.mockservice.entity.Stubs;
import project.mockservice.enums.StubStatus;

import java.util.List;
import java.util.Optional;

@Repository
public interface StubRepository extends MongoRepository<Stubs, String> {

    List<Stubs> findAllByStatus(StubStatus status);

    Optional<Stubs> findByMethodAndUrlPath(String method, String urlPath);

    List<Stubs> findByMethod(String method);
}
