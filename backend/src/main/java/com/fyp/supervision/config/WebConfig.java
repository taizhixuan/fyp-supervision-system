package com.fyp.supervision.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.file.upload-dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Only profile images are public. Everything else under uploads/ (resources,
        // documents, announcement attachments, reports, exports, backups) is gated and
        // must be served through the authenticated controller endpoints that enforce
        // ownership/visibility — never statically. Serving the whole tree here would let
        // anyone fetch a gated file by URL, bypassing those checks.
        registry.addResourceHandler("/uploads/profiles/**")
                .addResourceLocations("file:" + uploadDir + "/profiles/");
    }
}
