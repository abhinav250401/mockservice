package project.mockservice.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;
import project.mockservice.entity.Users;
import project.mockservice.repository.UserRepository;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
public class LoginController {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody LoginRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username already exists."));
        }

        Users newUser = new Users();
        newUser.setUsername(request.getUsername());

        newUser.setSecretCode(passwordEncoder.encode(request.getSecretCode()));

        userRepository.save(newUser);

        return ResponseEntity.ok(Map.of("message", "Agent profile created successfully."));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        Optional<Users> userOpt = userRepository.findByUsername(request.getUsername());

        if (userOpt.isPresent() && passwordEncoder.matches(request.getSecretCode(), userOpt.get().getSecretCode())) {
            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    request.getUsername(),
                    null,
                    Collections.emptyList()
            );
            SecurityContextHolder.getContext().setAuthentication(authToken);
            httpRequest.getSession(true).setAttribute(
                    HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                    SecurityContextHolder.getContext()
            );

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Access Granted. Initializing dashboard..."
            ));
        }

        return ResponseEntity.status(401).body(Map.of(
                "status", "error",
                "message", "Access Denied. Protocol breach detected."
        ));
    }
}
@Data
@AllArgsConstructor
class LoginRequest {
    private String username;
    private String secretCode;
}
