package com.fyp.supervision;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FypSupervisionApplication {
    public static void main(String[] args) {
        SpringApplication.run(FypSupervisionApplication.class, args);
    }
}
