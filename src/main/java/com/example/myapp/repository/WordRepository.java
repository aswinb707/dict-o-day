package com.example.myapp.repository;

import com.example.myapp.entity.Word;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WordRepository extends JpaRepository<Word, UUID> {

    /**
     * Personalized word query: fetch words matching user difficulty,
     * excluding already learned words, limited to user's daily word_count.
     */
    @Query(value = """
        SELECT w.* FROM words w
        WHERE w.fused_word IS NULL AND w.id NOT IN (
            SELECT uwp.word_id FROM user_word_progress uwp
            WHERE uwp.user_id = :userId AND (uwp.status = 'mastered' OR (uwp.postponed_until IS NOT NULL AND uwp.postponed_until > CURRENT_DATE))
        )
        ORDER BY RANDOM()
        LIMIT :limit
        """, nativeQuery = true)
    List<Word> findTodayWords(@Param("userId") UUID userId, @Param("limit") int limit);

    @Query(value = """
        SELECT w.* FROM words w
        LEFT JOIN user_word_progress uwp ON w.id = uwp.word_id AND uwp.user_id = :userId
        WHERE w.fused_word IS NULL AND w.id NOT IN (
            SELECT p.word_id FROM user_word_progress p
            WHERE p.user_id = :userId AND (p.status = 'mastered' OR (p.postponed_until IS NOT NULL AND p.postponed_until > CURRENT_DATE))
        )
        ORDER BY 
            CASE WHEN uwp.mastery_score IS NOT NULL THEN 0 ELSE 1 END,
            uwp.mastery_score ASC,
            RANDOM()
        LIMIT :limit
        """, nativeQuery = true)
    List<Word> findTodayWordsPersonalized(@Param("userId") UUID userId, @Param("limit") int limit);

    @Query("SELECT w FROM Word w WHERE LOWER(w.word) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Word> searchWords(@Param("query") String query);

    List<Word> findByIdIn(List<UUID> ids);

    java.util.Optional<Word> findByWordIgnoreCase(String word);

    boolean existsByWordIgnoreCase(String word);
}
