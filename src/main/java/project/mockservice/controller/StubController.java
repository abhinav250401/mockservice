package project.mockservice.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.mockservice.dto.StubDTO;
import project.mockservice.enums.StubStatus;
import project.mockservice.service.StubService;

import java.util.List;

@RestController
@RequestMapping("/stubs")
@RequiredArgsConstructor
@CrossOrigin(allowedHeaders = "*")
public class StubController {

    private final StubService stubService;
    @PostMapping("/create")
    public ResponseEntity<?> createStub(@Valid @RequestBody StubDTO stubDTO) {
        stubService.createStub(stubDTO);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStubStatus(
            @PathVariable String id,
            @RequestParam StubStatus status) {

        stubService.updateStubStatus(id, status);
        return ResponseEntity.ok().build();
    }


    @GetMapping(value = "/list")
    public ResponseEntity<?> getAllStubs() {
        List<StubDTO> stubs = stubService.getAllStubs();
        return ResponseEntity.ok(stubs);
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStub(@PathVariable String id) {
        stubService.deleteStub(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateStub(
            @PathVariable String id,
            @Valid @RequestBody StubDTO stubDTO) {

        stubService.updateStub(id, stubDTO);
        return ResponseEntity.ok("Updated Successfully");
    }
}
