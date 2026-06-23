package com.example.myapp.repository;

import com.example.myapp.entity.DailySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DailySessionRepository extends JpaRepository<DailySession, UUID> {

    Optional<DailySession> findByUserIdAndSessionDate(UUID userId, LocalDate sessionDate);
}
