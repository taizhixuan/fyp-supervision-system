package com.fyp.supervision.service;

import com.fyp.supervision.config.FileStorageConfig;
import com.fyp.supervision.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final FileStorageConfig fileStorageConfig;

    // Avatars are served from the public /uploads tree, so an uploaded .svg/.html could
    // execute script in the app origin. Restrict to real raster images (SVG excluded).
    private static final java.util.Set<String> ALLOWED_IMAGE_TYPES =
            java.util.Set.of("image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif");
    private static final long MAX_IMAGE_BYTES = 5L * 1024 * 1024;

    /** Validates that the upload is a reasonably-sized raster image, then stores it. */
    public String storeImage(MultipartFile file, String entity, Long userId) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("No image file provided.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Only PNG, JPEG, WEBP or GIF images are allowed.");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new BadRequestException("Image must be 5 MB or smaller.");
        }
        return storeFile(file, entity, userId);
    }

    public String storeFile(MultipartFile file, String entity, Long userId) {
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");

        if (originalFilename.contains("..")) {
            throw new BadRequestException("Invalid file path.");
        }

        String storedFilename = UUID.randomUUID() + "-" + originalFilename;
        String relativePath = "uploads/" + entity + "/" + userId + "/" + storedFilename;

        try {
            Path targetDir = fileStorageConfig.getUploadPath().resolve(entity).resolve(userId.toString());
            Files.createDirectories(targetDir);
            Path targetLocation = targetDir.resolve(storedFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new BadRequestException("Could not store file. Please try again.");
        }

        return relativePath;
    }

    public Resource loadFile(String storagePath) {
        try {
            Path filePath = fileStorageConfig.getUploadPath().resolve(
                    storagePath.startsWith("uploads/") ? storagePath.substring(8) : storagePath
            ).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists()) {
                return resource;
            } else {
                throw new BadRequestException("File not found.");
            }
        } catch (MalformedURLException e) {
            throw new BadRequestException("File not found.");
        }
    }

    public void deleteFile(String storagePath) {
        try {
            Path filePath = fileStorageConfig.getUploadPath().resolve(
                    storagePath.startsWith("uploads/") ? storagePath.substring(8) : storagePath
            ).normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            // Log and continue — file may have already been deleted
        }
    }
}
