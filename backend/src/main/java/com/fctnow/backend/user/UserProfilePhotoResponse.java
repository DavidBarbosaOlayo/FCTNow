package com.fctnow.backend.user;

import java.util.Base64;

public record UserProfilePhotoResponse(
    boolean hasPhoto,
    String photoDataUrl,
    String fotoContentType,
    String fotoFileName) {

  public static UserProfilePhotoResponse from(UserAccount user) {
    if (user.getFotoContent() == null || user.getFotoContentType() == null) {
      return new UserProfilePhotoResponse(false, null, null, null);
    }
    String dataUrl = String.format(
        "data:%s;base64,%s",
        user.getFotoContentType(),
        Base64.getEncoder().encodeToString(user.getFotoContent()));
    return new UserProfilePhotoResponse(
        true,
        dataUrl,
        user.getFotoContentType(),
        user.getFotoFileName());
  }
}
