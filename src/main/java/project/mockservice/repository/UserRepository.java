package project.mockservice.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import project.mockservice.entity.Users;
import java.util.Optional;

public interface UserRepository extends MongoRepository<Users, String> {
    Optional<Users> findByUsername(String username);
}
