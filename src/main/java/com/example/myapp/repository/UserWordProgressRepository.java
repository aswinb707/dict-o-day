package com.example.myapp.repository;

import com.example.myapp.entity.UserWordProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserWordProgressRepository extends JpaRepository<UserWordProgress, UUID> {

    List<UserWordProgress> findByUserId(UUID userId);

    Optional<UserWordProgress> findByUserIdAndWordId(UUID userId, UUID wordId);

    List<UserWordProgress> findByUserIdAndStatus(UUID userId, String status);

    long countByUserIdAndStatus(UUID userId, String status);
}
