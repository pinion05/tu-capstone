package com.tucapstone.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/health")
            .allowedOriginPatterns("*")
            .allowedMethods("GET", "OPTIONS");

        registry.addMapping("/api/v1/**")
            .allowedOriginPatterns("*")
            .allowedMethods("GET", "POST", "OPTIONS")
            .allowedHeaders("*");
    }
}
