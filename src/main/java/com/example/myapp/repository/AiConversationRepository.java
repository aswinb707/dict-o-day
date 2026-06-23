package com.example.myapp.repository;

import com.example.myapp.entity.AiConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AiConversationRepository extends JpaRepository<AiConversation, UUID> {

    List<AiConversation> findByUserIdAndWordIdOrderByCreatedAtAsc(UUID userId, UUID wordId);

    List<AiConversation> findTop20ByUserIdOrderByCreatedAtDesc(UUID userId);
}
