package com.example.myapp.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

@Configuration
public class DatabaseConfig {

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Value("${spring.datasource.url}")
    private String defaultUrl;

    @Value("${spring.datasource.username}")
    private String defaultUsername;

    @Value("${spring.datasource.password}")
    private String defaultPassword;

    @Bean
    public DataSource dataSource() {
        if (databaseUrl == null || databaseUrl.isEmpty()) {
            return DataSourceBuilder.create()
                    .driverClassName("org.postgresql.Driver")
                    .url(defaultUrl)
                    .username(defaultUsername)
                    .password(defaultPassword)
                    .build();
        }

        try {
            URI dbUri = new URI(databaseUrl);
            String userInfo = dbUri.getUserInfo();
            if (userInfo == null || !userInfo.contains(":")) {
                throw new IllegalArgumentException("Invalid user info in DATABASE_URL");
            }
            String username = userInfo.split(":")[0];
            String password = userInfo.split(":")[1];
            
            // Build the JDBC URL, explicitly requiring SSL for production/Render connections
            String host = dbUri.getHost();
            int port = dbUri.getPort();
            if (port == -1) {
                port = 5432;
            }
            String path = dbUri.getPath();
            
            String dbUrl = String.format("jdbc:postgresql://%s:%d%s?sslmode=require", host, port, path);

            return DataSourceBuilder.create()
                    .driverClassName("org.postgresql.Driver")
                    .url(dbUrl)
                    .username(username)
                    .password(password)
                    .build();
        } catch (URISyntaxException | NullPointerException | IllegalArgumentException e) {
            throw new RuntimeException("Failed to parse DATABASE_URL: " + databaseUrl, e);
        }
    }
}
