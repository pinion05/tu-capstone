package com.tucapstone.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@EnableJpaAuditing
@SpringBootApplication
public class TuCapStoneApplication {

    public static void main(String[] args) {
        SpringApplication.run(TuCapStoneApplication.class, args);
    }
}