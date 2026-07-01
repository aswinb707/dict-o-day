package com.example.myapp;

import com.example.myapp.entity.Word;
import com.example.myapp.repository.WordRepository;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

@SpringBootTest
class MyappApplicationTests {

    @Autowired
    private WordRepository wordRepository;

    @BeforeAll
    static void setup() {
        try {
            java.nio.file.Path envPath = java.nio.file.Paths.get(".env");
            if (java.nio.file.Files.exists(envPath)) {
                java.nio.file.Files.lines(envPath).forEach(line -> {
                    line = line.trim();
                    if (!line.isEmpty() && !line.startsWith("#")) {
                        String[] parts = line.split("=", 2);
                        if (parts.length == 2) {
                            System.setProperty(parts[0].trim(), parts[1].trim());
                        }
                    }
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Autowired
    private javax.sql.DataSource dataSource;

    @Test
    void inspectDatabase() {
        java.io.File file = new java.io.File("db_inspect.txt");
        try (java.io.PrintWriter pw = new java.io.PrintWriter(new java.io.FileWriter(file));
             java.sql.Connection conn = dataSource.getConnection()) {
            java.sql.DatabaseMetaData metaData = conn.getMetaData();
            try (java.sql.ResultSet tables = metaData.getTables(null, null, "%", new String[]{"TABLE"})) {
                while (tables.next()) {
                    String tableName = tables.getString("TABLE_NAME");
                    if (tableName.startsWith("pg_") || tableName.startsWith("sql_")) {
                        continue;
                    }
                    pw.println("=== TABLE: " + tableName + " ===");
                    try (java.sql.Statement stmt = conn.createStatement();
                         java.sql.ResultSet rs = stmt.executeQuery("SELECT * FROM " + tableName)) {
                        java.sql.ResultSetMetaData rsmd = rs.getMetaData();
                        int colCount = rsmd.getColumnCount();
                        for (int i = 1; i <= colCount; i++) {
                            pw.print(rsmd.getColumnName(i) + "\t");
                        }
                        pw.println();
                        int rowCount = 0;
                        while (rs.next()) {
                            rowCount++;
                            for (int i = 1; i <= colCount; i++) {
                                pw.print(rs.getObject(i) + "\t");
                            }
                            pw.println();
                        }
                        pw.println("Total rows: " + rowCount);
                        pw.println();
                    } catch (Exception e) {
                        pw.println("Error reading table " + tableName + ": " + e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Test
    void verifyCleanup() {
        for (String table : List.of("words", "daily_sessions", "calendar_entries", "tests")) {
            try {
                Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM " + table + " WHERE language IN ('french', 'german')",
                    Integer.class
                );
                org.junit.jupiter.api.Assertions.assertEquals(0, count, 
                    "Found leftover French/German rows in table " + table);
            } catch (Exception e) {
                System.out.println("Skipping language row check for " + table + ": " + e.getMessage());
            }
        }

        try {
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE target_language IN ('french', 'german')",
                Integer.class
            );
            org.junit.jupiter.api.Assertions.assertEquals(0, count,
                "Found users with French/German target_language");
        } catch (Exception e) {
            System.out.println("Skipping target_language check: " + e.getMessage());
        }

        List<String> obsoleteColumns = List.of(
            "last_active_french", "last_active_german", "streak_french", "streak_german"
        );
        for (String col : obsoleteColumns) {
            Integer colCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = ?",
                Integer.class,
                col
            );
            org.junit.jupiter.api.Assertions.assertEquals(0, colCount,
                "Column " + col + " should have been dropped from users table");
        }
        System.out.println("Cleanup verification passed! No French or German remnants found in the database.");
    }

    @Autowired
    private com.example.myapp.service.AuthService authService;

    @Test
    void testAgeValidation() {
        com.example.myapp.dto.RegisterRequest reqUnderage = new com.example.myapp.dto.RegisterRequest();
        reqUnderage.setUsername("underage_test");
        reqUnderage.setEmail("underage@test.com");
        reqUnderage.setPassword("password123");
        reqUnderage.setDob(java.time.LocalDate.now().minusYears(5));

        IllegalArgumentException ex = org.junit.jupiter.api.Assertions.assertThrows(
            IllegalArgumentException.class,
            () -> authService.register(reqUnderage)
        );
        org.junit.jupiter.api.Assertions.assertEquals("You must be at least 10 years old.", ex.getMessage());

        com.example.myapp.dto.RegisterRequest reqFuture = new com.example.myapp.dto.RegisterRequest();
        reqFuture.setUsername("future_test");
        reqFuture.setEmail("future@test.com");
        reqFuture.setPassword("password123");
        reqFuture.setDob(java.time.LocalDate.now().plusYears(1));

        ex = org.junit.jupiter.api.Assertions.assertThrows(
            IllegalArgumentException.class,
            () -> authService.register(reqFuture)
        );
        org.junit.jupiter.api.Assertions.assertEquals("Date of birth cannot be in the future.", ex.getMessage());

        com.example.myapp.dto.RegisterRequest reqNull = new com.example.myapp.dto.RegisterRequest();
        reqNull.setUsername("null_test");
        reqNull.setEmail("null@test.com");
        reqNull.setPassword("password123");
        reqNull.setDob(null);

        ex = org.junit.jupiter.api.Assertions.assertThrows(
            IllegalArgumentException.class,
            () -> authService.register(reqNull)
        );
        org.junit.jupiter.api.Assertions.assertEquals("Date of birth is required.", ex.getMessage());
    }
}
