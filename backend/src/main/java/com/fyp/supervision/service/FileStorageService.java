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
