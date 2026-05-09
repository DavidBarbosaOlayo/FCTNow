package com.fctnow.backend.ofertas.externas;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.Test;

class AdzunaServiceTest {

  private final AdzunaProperties properties = new AdzunaProperties(
      "https://api.adzuna.com/v1/api/jobs",
      "es",
      "test-id",
      "test-key",
      List.of("prácticas", "becario", "internship"),
      Duration.ofSeconds(2));

  @Test
  void mapsAdzunaJobsToInternalDto() {
    AdzunaClient client = mock(AdzunaClient.class);
    AdzunaJob job = new AdzunaJob(
        "12345",
        "Becario de desarrollo",
        "Prácticas como becario en equipo backend",
        "https://www.adzuna.es/land/ad/12345",
        OffsetDateTime.of(2026, 5, 1, 10, 30, 0, 0, ZoneOffset.UTC),
        new AdzunaJob.AdzunaCompany("Tech Iberia"),
        new AdzunaJob.AdzunaLocation(
            "Valencia, Comunidad Valenciana, España",
            List.of("España", "Comunidad Valenciana", "Valencia")),
        new AdzunaJob.AdzunaCategory("it-jobs", "TI"),
        18000.0,
        24000.0,
        "0",
        "permanent",
        "full_time");
    when(client.search(any(), any(), any(), any(), anyInt(), anyInt()))
        .thenReturn(new AdzunaSearchResponse(57L, List.of(job)));

    AdzunaService service = new AdzunaService(client, properties);

    OfertaExternaPageResponse response = service.search("dev", "Valencia", "it-jobs", 2, 25);

    assertThat(response.results()).hasSize(1);
    OfertaExternaResponse mapped = response.results().get(0);
    assertThat(mapped.id()).isEqualTo("12345");
    assertThat(mapped.fuente()).isEqualTo("ADZUNA");
    assertThat(mapped.titulo()).isEqualTo("Becario de desarrollo");
    assertThat(mapped.empresaNombre()).isEqualTo("Tech Iberia");
    assertThat(mapped.localidad()).isEqualTo("Valencia");
    assertThat(mapped.region()).isEqualTo("Comunidad Valenciana");
    assertThat(mapped.categoria()).isEqualTo("TI");
    assertThat(mapped.salarioMinimo()).isEqualTo(18000.0);
    assertThat(mapped.salarioMaximo()).isEqualTo(24000.0);
    assertThat(mapped.salarioEstimado()).isFalse();
    assertThat(mapped.contratoTipo()).isEqualTo("permanent");
    assertThat(mapped.jornada()).isEqualTo("full_time");
    assertThat(mapped.publicadoEn()).isEqualTo("2026-05-01T10:30:00Z");
    assertThat(mapped.urlAplicacion()).isEqualTo("https://www.adzuna.es/land/ad/12345");

    assertThat(response.page()).isEqualTo(2);
    assertThat(response.resultsPerPage()).isEqualTo(25);
    assertThat(response.totalResults()).isEqualTo(57L);
    assertThat(response.attribution()).contains("Adzuna");
    assertThat(response.attributionUrl()).isEqualTo("https://www.adzuna.es/");
  }

  @Test
  void forwardsCategoryToAdzunaClient() {
    AdzunaClient client = mock(AdzunaClient.class);
    when(client.search(any(), any(), any(), any(), anyInt(), anyInt()))
        .thenReturn(new AdzunaSearchResponse(0L, List.of()));

    AdzunaService service = new AdzunaService(client, properties);
    service.search("dev", "Valencia", "it-jobs", 1, 10);

    verify(client).search(eq("dev"), any(), eq("Valencia"), eq("it-jobs"), eq(1), eq(10));
  }

  @Test
  void clampsPaginationDefaults() {
    AdzunaClient client = mock(AdzunaClient.class);
    when(client.search(any(), any(), any(), any(), anyInt(), anyInt()))
        .thenReturn(new AdzunaSearchResponse(0L, List.of()));

    AdzunaService service = new AdzunaService(client, properties);

    service.search(null, null, null, null, null);
    verify(client).search(eq(null), any(), eq(null), eq(null), eq(1), eq(20));

    service.search(null, null, null, 0, 200);
    verify(client).search(eq(null), any(), eq(null), eq(null), eq(1), eq(50));
  }

  @Test
  void usesConfiguredKeywordsForOrFilter() {
    AdzunaClient client = mock(AdzunaClient.class);
    when(client.search(any(), any(), any(), any(), anyInt(), anyInt()))
        .thenReturn(new AdzunaSearchResponse(0L, List.of()));

    AdzunaService service = new AdzunaService(client, properties);
    service.search(null, null, null, null, null);

    verify(client).search(
        eq(null),
        eq("prácticas becario internship"),
        eq(null),
        eq(null),
        eq(1),
        eq(20));
  }
}
