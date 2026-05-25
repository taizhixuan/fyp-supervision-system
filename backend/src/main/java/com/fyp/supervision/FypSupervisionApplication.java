package com.fyp.supervision;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
public class FypSupervisionApplication {
    public static void main(String[] args) {
        SpringApplication.run(FypSupervisionApplication.class, args);
    }

    /** Pin the JVM default to Asia/Kuala_Lumpur so LocalDateTime.now() / SQL
     *  NOW() / Hibernate audit fields all use Malaysia local time regardless
     *  of the deploy host's clock. */
    @PostConstruct
    void initTimeZone() {
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kuala_Lumpur"));
    }
}
