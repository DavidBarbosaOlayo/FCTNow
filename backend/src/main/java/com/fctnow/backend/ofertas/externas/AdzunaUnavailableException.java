package com.fctnow.backend.ofertas.externas;

public class AdzunaUnavailableException extends RuntimeException {

  public AdzunaUnavailableException(String message) {
    super(message);
  }

  public AdzunaUnavailableException(String message, Throwable cause) {
    super(message, cause);
  }
}
