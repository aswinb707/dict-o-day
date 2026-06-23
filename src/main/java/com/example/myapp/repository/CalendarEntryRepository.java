package com.example.myapp.repository;

import com.example.myapp.entity.CalendarEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CalendarEntryRepository extends JpaRepository<CalendarEntry, UUID> {

    List<CalendarEntry> findByUserIdOrderByEntryDateDesc(UUID userId);

    Optional<CalendarEntry> findByUserIdAndEntryDate(UUID userId, LocalDate entryDate);
}
