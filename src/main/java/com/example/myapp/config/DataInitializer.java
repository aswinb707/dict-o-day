package com.example.myapp.config;

import com.example.myapp.entity.Word;
import com.example.myapp.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    @Bean
    public CommandLineRunner seedWords(WordRepository wordRepository, org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        return args -> {
            log.info("Starting database cleanup for French and German references...");
            try {
                jdbcTemplate.execute("DELETE FROM session_words WHERE session_id IN (SELECT id FROM daily_sessions WHERE language IN ('french', 'german'))");
            } catch (Exception e) {
                log.warn("Could not delete from session_words: {}", e.getMessage());
            }
            try {
                jdbcTemplate.execute("DELETE FROM daily_sessions WHERE language IN ('french', 'german')");
            } catch (Exception e) {
                log.warn("Could not delete from daily_sessions: {}", e.getMessage());
            }
            try {
                jdbcTemplate.execute("DELETE FROM calendar_entries WHERE language IN ('french', 'german')");
            } catch (Exception e) {
                log.warn("Could not delete from calendar_entries: {}", e.getMessage());
            }
            try {
                jdbcTemplate.execute("DELETE FROM tests WHERE language IN ('french', 'german')");
            } catch (Exception e) {
                log.warn("Could not delete from tests: {}", e.getMessage());
            }
            try {
                jdbcTemplate.execute("DELETE FROM words WHERE language IN ('french', 'german')");
            } catch (Exception e) {
                log.warn("Could not delete from words: {}", e.getMessage());
            }
            try {
                jdbcTemplate.execute("UPDATE users SET target_language = null WHERE target_language IN ('french', 'german')");
            } catch (Exception e) {
                log.warn("Could not update users target_language: {}", e.getMessage());
            }
            try {
                jdbcTemplate.execute("ALTER TABLE users DROP COLUMN IF EXISTS last_active_french");
                jdbcTemplate.execute("ALTER TABLE users DROP COLUMN IF EXISTS last_active_german");
                jdbcTemplate.execute("ALTER TABLE users DROP COLUMN IF EXISTS streak_french");
                jdbcTemplate.execute("ALTER TABLE users DROP COLUMN IF EXISTS streak_german");
                log.info("Dropped French and German columns from users table successfully.");
            } catch (Exception e) {
                log.warn("Could not drop French and German columns from users table: {}", e.getMessage());
            }

            if (wordRepository.count() == 0) {
                List<Word> words = List.of(
                    Word.builder().word("Ubiquitous").pronunciation("yoo-BIK-wih-tuhs").definition("Present, appearing, or found everywhere.").partOfSpeech("adjective").inASentence("Mobile phones have become ubiquitous in modern society.").examples(List.of("Smartphones are ubiquitous in urban areas.", "The ubiquitous coffee chain has stores on every corner.")).tags(List.of("advanced", "competitive_exam")).synonyms("omnipresent, ever-present, everywhere, pervasive").antonyms("rare, scarce, infrequent, uncommon").build(),
                    Word.builder().word("Eloquent").pronunciation("EL-uh-kwuhnt").definition("Fluent or persuasive in speaking or writing.").partOfSpeech("adjective").inASentence("She gave an eloquent speech that moved the audience.").examples(List.of("His eloquent defense won the case.", "The poet's eloquent verses captured hearts.")).tags(List.of("intermediate", "interview")).synonyms("fluent, articulate, persuasive, expressive").antonyms("inarticulate, tongue-tied, unexpressive").build(),
                    Word.builder().word("Pragmatic").pronunciation("prag-MAT-ik").definition("Dealing with things sensibly and realistically.").partOfSpeech("adjective").inASentence("We need a pragmatic approach to solve this problem.").examples(List.of("The pragmatic leader focused on achievable goals.", "A pragmatic solution was found.")).tags(List.of("advanced", "interview")).synonyms("practical, realistic, sensible, down-to-earth").antonyms("idealistic, impractical, visionary").build(),
                    Word.builder().word("Resilient").pronunciation("rih-ZIL-yuhnt").definition("Able to recover quickly from difficulties.").partOfSpeech("adjective").inASentence("Children are remarkably resilient.").examples(List.of("The resilient economy bounced back after the recession.", "She proved resilient in the face of adversity.")).tags(List.of("intermediate", "competitive_exam")).synonyms("buoyant, strong, tough, hardy").antonyms("vulnerable, fragile, weak, delicate").build(),
                    Word.builder().word("Ambiguous").pronunciation("am-BIG-yoo-uhs").definition("Open to more than one interpretation; not clear.").partOfSpeech("adjective").inASentence("The ambiguous wording of the contract led to disputes.").examples(List.of("Her ambiguous smile left him confused.", "The law is deliberately ambiguous.")).tags(List.of("intermediate", "competitive_exam")).synonyms("equivocal, obscure, unclear, vague").antonyms("clear, unambiguous, precise, definite").build(),
                    Word.builder().word("Meticulous").pronunciation("muh-TIK-yuh-luhs").definition("Showing great attention to detail; very careful.").partOfSpeech("adjective").inASentence("She was meticulous in her research.").examples(List.of("The meticulous craftsman produced flawless work.", "Meticulous planning ensured the event's success.")).tags(List.of("advanced", "interview")).synonyms("careful, conscientious, diligent, precise").antonyms("careless, sloppy, negligent").build(),
                    Word.builder().word("Ephemeral").pronunciation("ih-FEM-er-uhl").definition("Lasting for a very short time.").partOfSpeech("adjective").inASentence("Fame in the modern world is often ephemeral.").examples(List.of("The ephemeral beauty of cherry blossoms.", "Social media trends are ephemeral.")).tags(List.of("advanced", "competitive_exam")).synonyms("transient, fleeting, passing, short-lived").antonyms("eternal, permanent, everlasting").build(),
                    Word.builder().word("Candid").pronunciation("KAN-did").definition("Truthful and straightforward; frank.").partOfSpeech("adjective").inASentence("I appreciate your candid feedback.").examples(List.of("The politician gave a candid interview.", "A candid photo captured the moment.")).tags(List.of("beginner", "interview")).synonyms("frank, open, honest, sincere").antonyms("guarded, secretive, insincere, devious").build(),
                    Word.builder().word("Diligent").pronunciation("DIL-ih-juhnt").definition("Having or showing care in one's work.").partOfSpeech("adjective").inASentence("The diligent student always completed homework early.").examples(List.of("Diligent efforts led to the project's success.", "She was diligent in her preparation.")).tags(List.of("beginner", "competitive_exam")).synonyms("industrious, hardworking, conscientious, assiduous").antonyms("lazy, idle, negligent").build(),
                    Word.builder().word("Unprecedented").pronunciation("un-PRES-ih-den-tid").definition("Never done or known before.").partOfSpeech("adjective").inASentence("The company achieved unprecedented growth.").examples(List.of("Unprecedented rainfall caused flooding.", "This is an unprecedented situation.")).tags(List.of("intermediate", "competitive_exam")).synonyms("unparalleled, unequaled, unmatched, novel").antonyms("common, normal, typical, familiar").build()
                );
                wordRepository.saveAll(words);
                log.info("Seeded {} vocabulary words into the database.", words.size());
            }

            // Always update existing words if their synonyms or antonyms are null
            List<Word> existingWords = wordRepository.findAll();
            boolean updated = false;
            for (Word existing : existingWords) {
                if (existing.getSynonyms() == null || existing.getAntonyms() == null) {
                    updateSynonymsAndAntonyms(existing);
                    wordRepository.save(existing);
                    updated = true;
                }
            }
            if (updated) {
                log.info("Updated existing seeded words with synonyms and antonyms.");
            }
        };
    }

    private void updateSynonymsAndAntonyms(Word word) {
        switch (word.getWord().toLowerCase()) {
            case "ubiquitous":
                word.setSynonyms("omnipresent, ever-present, everywhere, pervasive");
                word.setAntonyms("rare, scarce, infrequent, uncommon");
                break;
            case "eloquent":
                word.setSynonyms("fluent, articulate, persuasive, expressive");
                word.setAntonyms("inarticulate, tongue-tied, unexpressive");
                break;
            case "pragmatic":
                word.setSynonyms("practical, realistic, sensible, down-to-earth");
                word.setAntonyms("idealistic, impractical, visionary");
                break;
            case "resilient":
                word.setSynonyms("buoyant, strong, tough, hardy");
                word.setAntonyms("vulnerable, fragile, weak, delicate");
                break;
            case "ambiguous":
                word.setSynonyms("equivocal, obscure, unclear, vague");
                word.setAntonyms("clear, unambiguous, precise, definite");
                break;
            case "meticulous":
                word.setSynonyms("careful, conscientious, diligent, precise");
                word.setAntonyms("careless, sloppy, negligent");
                break;
            case "ephemeral":
                word.setSynonyms("transient, fleeting, passing, short-lived");
                word.setAntonyms("eternal, permanent, everlasting");
                break;
            case "candid":
                word.setSynonyms("frank, open, honest, sincere");
                word.setAntonyms("guarded, secretive, insincere, devious");
                break;
            case "diligent":
                word.setSynonyms("industrious, hardworking, conscientious, assiduous");
                word.setAntonyms("lazy, idle, negligent");
                break;
            case "unprecedented":
                word.setSynonyms("unparalleled, unequaled, unmatched, novel");
                word.setAntonyms("common, normal, typical, familiar");
                break;
            default:
                if (word.getSynonyms() == null) word.setSynonyms("N/A");
                if (word.getAntonyms() == null) word.setAntonyms("N/A");
                break;
        }
    }
}
