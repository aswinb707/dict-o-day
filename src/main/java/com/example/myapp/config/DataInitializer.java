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
    public CommandLineRunner seedWords(WordRepository wordRepository) {
        return args -> {
            if (wordRepository.count() == 0) {
                List<Word> words = List.of(
                    Word.builder().word("Ubiquitous").pronunciation("yoo-BIK-wih-tuhs").definition("Present, appearing, or found everywhere.").partOfSpeech("adjective").inASentence("Mobile phones have become ubiquitous in modern society.").examples(List.of("Smartphones are ubiquitous in urban areas.", "The ubiquitous coffee chain has stores on every corner.")).tags(List.of("advanced", "competitive_exam")).build(),
                    Word.builder().word("Eloquent").pronunciation("EL-uh-kwuhnt").definition("Fluent or persuasive in speaking or writing.").partOfSpeech("adjective").inASentence("She gave an eloquent speech that moved the audience.").examples(List.of("His eloquent defense won the case.", "The poet's eloquent verses captured hearts.")).tags(List.of("intermediate", "interview")).build(),
                    Word.builder().word("Pragmatic").pronunciation("prag-MAT-ik").definition("Dealing with things sensibly and realistically.").partOfSpeech("adjective").inASentence("We need a pragmatic approach to solve this problem.").examples(List.of("The pragmatic leader focused on achievable goals.", "A pragmatic solution was found.")).tags(List.of("advanced", "interview")).build(),
                    Word.builder().word("Resilient").pronunciation("rih-ZIL-yuhnt").definition("Able to recover quickly from difficulties.").partOfSpeech("adjective").inASentence("Children are remarkably resilient.").examples(List.of("The resilient economy bounced back after the recession.", "She proved resilient in the face of adversity.")).tags(List.of("intermediate", "competitive_exam")).build(),
                    Word.builder().word("Ambiguous").pronunciation("am-BIG-yoo-uhs").definition("Open to more than one interpretation; not clear.").partOfSpeech("adjective").inASentence("The ambiguous wording of the contract led to disputes.").examples(List.of("Her ambiguous smile left him confused.", "The law is deliberately ambiguous.")).tags(List.of("intermediate", "competitive_exam")).build(),
                    Word.builder().word("Meticulous").pronunciation("muh-TIK-yuh-luhs").definition("Showing great attention to detail; very careful.").partOfSpeech("adjective").inASentence("She was meticulous in her research.").examples(List.of("The meticulous craftsman produced flawless work.", "Meticulous planning ensured the event's success.")).tags(List.of("advanced", "interview")).build(),
                    Word.builder().word("Ephemeral").pronunciation("ih-FEM-er-uhl").definition("Lasting for a very short time.").partOfSpeech("adjective").inASentence("Fame in the modern world is often ephemeral.").examples(List.of("The ephemeral beauty of cherry blossoms.", "Social media trends are ephemeral.")).tags(List.of("advanced", "competitive_exam")).build(),
                    Word.builder().word("Candid").pronunciation("KAN-did").definition("Truthful and straightforward; frank.").partOfSpeech("adjective").inASentence("I appreciate your candid feedback.").examples(List.of("The politician gave a candid interview.", "A candid photo captured the moment.")).tags(List.of("beginner", "interview")).build(),
                    Word.builder().word("Diligent").pronunciation("DIL-ih-juhnt").definition("Having or showing care in one's work.").partOfSpeech("adjective").inASentence("The diligent student always completed homework early.").examples(List.of("Diligent efforts led to the project's success.", "She was diligent in her preparation.")).tags(List.of("beginner", "competitive_exam")).build(),
                    Word.builder().word("Unprecedented").pronunciation("un-PRES-ih-den-tid").definition("Never done or known before.").partOfSpeech("adjective").inASentence("The company achieved unprecedented growth.").examples(List.of("Unprecedented rainfall caused flooding.", "This is an unprecedented situation.")).tags(List.of("intermediate", "competitive_exam")).build()
                );
                wordRepository.saveAll(words);
                log.info("Seeded {} vocabulary words into the database.", words.size());
            }
        };
    }
}
