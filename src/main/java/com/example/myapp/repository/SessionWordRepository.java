package com.example.myapp.repository;

import com.example.myapp.entity.SessionWord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SessionWordRepository extends JpaRepository<SessionWord, UUID> {

    List<SessionWord> findBySessionId(UUID sessionId);

    List<SessionWord> findBySessionIdAndMode(UUID sessionId, String mode);

    long countBySessionIdAndMode(UUID sessionId, String mode);
}
