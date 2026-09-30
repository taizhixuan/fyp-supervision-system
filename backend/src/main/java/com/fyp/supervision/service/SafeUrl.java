package com.fyp.supervision.service;

import com.fyp.supervision.exception.BadRequestException;

import java.net.URI;
import java.util.Locale;

/**
 * Validates URLs that are stored and later rendered as links for other users
 * (announcement links, meeting links). Only http/https: a stored {@code javascript:}
 * URL would run script in the viewer's session when clicked, and React doesn't block it.
 */
public final class SafeUrl {

    private SafeUrl() {}

    public static String require(String raw, String field) {
        if (raw == null) return null;
        String url = raw.trim();
        if (url.isEmpty()) return url;
        try {
            URI uri = URI.create(url);
            String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
            if ((scheme.equals("http") || scheme.equals("https")) && uri.getHost() != null) {
                return url;
            }
        } catch (IllegalArgumentException ignored) {
            // falls through to the error below
        }
        throw new BadRequestException(field + " must be an http:// or https:// link.");
    }
}
