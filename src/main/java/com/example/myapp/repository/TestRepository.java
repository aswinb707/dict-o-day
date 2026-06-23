package com.example.myapp.repository;

import com.example.myapp.entity.Test;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TestRepository extends JpaRepository<Test, UUID> {

    List<Test> findByUserIdOrderByTakenAtDesc(UUID userId);

    List<Test> findBySessionId(UUID sessionId);
}
