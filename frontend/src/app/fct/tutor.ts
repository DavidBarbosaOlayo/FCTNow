import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { AsignacionesExternasService } from '../asignaciones/asignaciones-externas.service';
import { AsignacionesService } from '../asignaciones/asignaciones.service';
import { calcFctProgress } from '../asignaciones/fct-progress';
import { MensajesCacheService } from '../mensajes/mensajes-cache.service';
import { MensajesService } from '../mensajes/mensajes.service';
import {
  TutorAlumno,
  TutorAlumnoCreateRequest,
  TutorAlumnoImportResult,
} from './tutor-alumnos.models';
import { TutorAlumnosService } from './tutor-alumnos.service';
import { TutorCacheService } from './tutor-cache.service';

type LoadStatus = 'loading' | 'loaded' | 'error';
type AssignStatus = 'idle' | 'assigning' | 'error' | 'success';
type CvActionStatus = 'idle' | 'loading' | 'error';
type CreateAlumnoStatus = 'idle' | 'saving' | 'error' | 'success';
type ImportStatus = 'idle' | 'uploading' | 'error' | 'success';
type ViewMode = 'list' | 'cards';

@Component({
  selector: 'app-tutor-page',
  imports: [ReactiveFormsModule],
  template: `
    <main class="page-shell route-page tutor-page">
      <section class="kpi-grid" aria-label="Resumen del alumnado">
        <article class="kpi-card">
          <p class="eyebrow">Alumnos</p>
          <p class="kpi-value">{{ alumnos().length }}</p>
        </article>
        <article class="kpi-card">
          <p class="eyebrow">Asignados</p>
          <p class="kpi-value">
            {{ totalAsignados() }}<span class="kpi-total">/{{ alumnos().length }}</span>
          </p>
        </article>
        <article class="kpi-card">
          <p class="eyebrow">Aceptados</p>
          <p class="kpi-value">
            {{ totalAceptados() }}<span class="kpi-total">/{{ alumnos().length }}</span>
          </p>
        </article>
        <article class="kpi-card kpi-warn">
          <p class="eyebrow">Solicitudes pendientes</p>
          <p class="kpi-value">{{ totalSolicitudesPendientes() }}</p>
        </article>
      </section>

      <section class="actions-panel" aria-label="Gestion de cuentas de alumno">
        <div>
          <p class="eyebrow">Gestion de cuentas</p>
          <h2>Alta de alumnos</h2>
        </div>
        <div class="actions-row">
          <button type="button" class="primary-button" (click)="openCreateAlumnoModal()">
            Crear alumno
          </button>
          <button
            type="button"
            class="secondary-button"
            [disabled]="importStatus() === 'uploading'"
            (click)="downloadImportTemplate()"
          >
            Descargar plantilla
          </button>
          <label class="secondary-button file-import-label" [class.is-disabled]="importStatus() === 'uploading'">
            {{ importStatus() === 'uploading' ? 'Importando...' : 'Importar Excel' }}
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              [disabled]="importStatus() === 'uploading'"
              (change)="importExcel($event)"
            />
          </label>
        </div>
        @if (importStatus() === 'error') {
          <p class="modal-error compact-alert" role="alert">{{ importError() }}</p>
        }
        @if (importResult(); as result) {
          <div class="import-result" aria-live="polite">
            <strong>{{ result.creados }} creados</strong>
            <span>{{ result.omitidos }} omitidos</span>
            <span>{{ result.errores }} errores</span>
            @if (importPreviewRows().length > 0) {
              <ul>
                @for (row of importPreviewRows(); track row.fila) {
                  <li [attr.data-estado]="row.estado">
                    Fila {{ row.fila }} · {{ row.email || row.displayName || 'sin datos' }} · {{ row.mensaje }}
                  </li>
                }
              </ul>
            }
          </div>
        }
      </section>

      <section class="filters-panel" aria-label="Filtros de alumnado">
        <div class="filters-row">
          <label class="filter-control">
            <span>Buscar</span>
            <input
              type="search"
              [formControl]="searchFilter"
              placeholder="Nombre, email o ciclo"
            />
          </label>
          <label class="filter-control">
            <span>Estado FCT</span>
            <select [formControl]="estadoFilter">
              <option value="TODOS">Todos</option>
              <option value="LISTO_PARA_ASIGNAR">Listo para asignar</option>
              <option value="ASIGNADO">Con asignación</option>
              <option value="SIN_ASIGNAR">Sin asignación</option>
            </select>
          </label>
          <label class="filter-control">
            <span>Familia profesional</span>
            <select [formControl]="familiaFilter">
              <option value="TODAS">Todas</option>
              @for (familia of familiasDisponibles(); track familia) {
                <option [value]="familia">{{ familia }}</option>
              }
            </select>
          </label>
          <label class="filter-control">
            <span>Ciclo formativo</span>
            <select [formControl]="cicloFilter">
              <option value="TODOS">Todos</option>
              @for (ciclo of ciclosDisponibles(); track ciclo) {
                <option [value]="ciclo">{{ ciclo }}</option>
              }
            </select>
          </label>
          <button
            type="button"
            class="clear-filters-button"
            [disabled]="!hasActiveFilters()"
            (click)="clearFilters()"
          >
            Limpiar
          </button>
          <div class="view-toggle" role="group" aria-label="Formato de visualización">
            <button
              type="button"
              [class.is-active]="viewMode() === 'list'"
              [attr.aria-pressed]="viewMode() === 'list'"
              (click)="setViewMode('list')"
            >
              Listado
            </button>
            <button
              type="button"
              [class.is-active]="viewMode() === 'cards'"
              [attr.aria-pressed]="viewMode() === 'cards'"
              (click)="setViewMode('cards')"
            >
              Cards
            </button>
          </div>
        </div>
      </section>

      @if (status() === 'loading') {
        <section class="state-panel" aria-live="polite">
          <p class="eyebrow">Cargando</p>
          <h2>Recuperando alumnado del centro</h2>
        </section>
      } @else if (status() === 'error') {
        <section class="state-panel alert" role="alert">
          <p class="eyebrow">Error</p>
          <h2>No se pudo cargar el listado</h2>
          <p>{{ errorMessage() }}</p>
        </section>
      } @else if (filteredAlumnos().length === 0) {
        <section class="state-panel">
          <p class="eyebrow">Sin coincidencias</p>
          <h2>No hay alumnos con esos filtros</h2>
        </section>
      } @else if (viewMode() === 'list') {
        <section
          class="alumno-list"
          aria-label="Listado detallado de alumnos"
        >
          @for (a of filteredAlumnos(); track a.id) {
            <article
              class="alumno-row"
              [class.is-assigned]="!!a.asignacionActual"
              [class.is-pending]="!a.asignacionActual && !!a.asignacionPendiente"
            >
              <div class="row-main">
                <button
                  type="button"
                  class="student-cell student-identity-button"
                  (click)="openAlumnoDetail(a)"
                >
                  <span class="student-avatar" [class.has-photo]="!!a.photoDataUrl">
                    @if (a.photoDataUrl) {
                      <img [src]="a.photoDataUrl" [alt]="'Foto de ' + a.displayName" />
                    } @else {
                      <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4Zm0 2c-3.4 0-6.4 1.7-8 4.4.8 1 3.4 1.6 8 1.6s7.2-.6 8-1.6c-1.6-2.7-4.6-4.4-8-4.4Z" />
                      </svg>
                    }
                  </span>
                  <div class="student-copy">
                    <h3 [attr.title]="a.displayName">{{ a.displayName }}</h3>
                    <p class="alumno-email" [attr.title]="a.email">{{ a.email }}</p>
                  </div>
                </button>
                <div class="status-cell">
                  @if (a.asignacionActual) {
                    <span class="estado-pill" [attr.data-estado]="a.asignacionActual.estado">
                      {{ estadoLabel(a.asignacionActual.estado) }}
                    </span>
                  } @else {
                    <span class="estado-pill estado-sin">Sin asignación</span>
                  }
                </div>
                <dl class="row-details" aria-label="Datos académicos">
                  <div>
                    <dt>Familia</dt>
                    <dd [attr.title]="a.preferencias?.familiaProfesional || null">
                      {{ a.preferencias?.familiaProfesional || '—' }}
                    </dd>
                  </div>
                  <div>
                    <dt>Ciclo</dt>
                    <dd [attr.title]="a.preferencias?.cicloFormativo || null">
                      {{ a.preferencias?.cicloFormativo || '—' }}
                    </dd>
                  </div>
                  <div>
                    <dt>Localidad</dt>
                    <dd [attr.title]="a.preferencias?.localidad || null">
                      {{ a.preferencias?.localidad || '—' }}
                    </dd>
                  </div>
                </dl>
                <div class="row-counters" aria-label="Resumen de solicitudes">
                  <span title="Total">{{ a.solicitudes.total }}</span>
                  <span title="Pendientes">{{ a.solicitudes.solicitadas }}</span>
                  <span title="Aceptadas">{{ a.solicitudes.aceptadas }}</span>
                  <span title="Rechazadas">{{ a.solicitudes.rechazadas }}</span>
                </div>
              </div>

              @if (a.asignacionActual) {
                <div class="row-assignment">
                  <span>Asignación</span>
                  <strong [attr.title]="a.asignacionActual.empresa">
                    {{ a.asignacionActual.empresa }}
                  </strong>
                  <span [attr.title]="a.asignacionActual.oferta">
                    {{ a.asignacionActual.oferta }}
                  </span>
                  <span [attr.title]="'Desde ' + formatFecha(a.asignacionActual.fechaAsignacion)">
                    Desde {{ formatFecha(a.asignacionActual.fechaAsignacion) }}
                  </span>
                </div>
              } @else if (a.asignacionPendiente) {
                <div class="row-assignment is-pending">
                  <span>Lista para asignar</span>
                  <strong [attr.title]="a.asignacionPendiente.empresa">
                    {{ a.asignacionPendiente.empresa }}
                  </strong>
                  <span [attr.title]="a.asignacionPendiente.oferta">
                    {{ a.asignacionPendiente.oferta }}
                  </span>
                  <button type="button" class="assign-button" (click)="openAssignModal(a)">
                    Asignar
                  </button>
                </div>
              }
            </article>
          }
        </section>
      } @else {
        <section class="alumno-grid" aria-label="Listado detallado de alumnos">
          @for (a of filteredAlumnos(); track a.id) {
            <article
              class="alumno-card"
              [class.is-assigned]="!!a.asignacionActual"
              [class.is-pending]="!a.asignacionActual && !!a.asignacionPendiente"
            >
              <header class="alumno-card-heading">
                <button
                  type="button"
                  class="student-cell card-student-cell student-identity-button"
                  (click)="openAlumnoDetail(a)"
                >
                  <span class="student-avatar" [class.has-photo]="!!a.photoDataUrl">
                    @if (a.photoDataUrl) {
                      <img [src]="a.photoDataUrl" [alt]="'Foto de ' + a.displayName" />
                    } @else {
                      <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4Zm0 2c-3.4 0-6.4 1.7-8 4.4.8 1 3.4 1.6 8 1.6s7.2-.6 8-1.6c-1.6-2.7-4.6-4.4-8-4.4Z" />
                      </svg>
                    }
                  </span>
                  <div class="student-copy">
                    <h3>{{ a.displayName }}</h3>
                    <p class="alumno-email">{{ a.email }}</p>
                  </div>
                </button>
                @if (a.asignacionActual) {
                  <span class="estado-pill" [attr.data-estado]="a.asignacionActual.estado">
                    {{ estadoLabel(a.asignacionActual.estado) }}
                  </span>
                } @else {
                  <span class="estado-pill estado-sin">Sin asignación</span>
                }
              </header>

              <dl class="alumno-details" aria-label="Datos académicos">
                <div>
                  <dt>Familia profesional</dt>
                  <dd>{{ a.preferencias?.familiaProfesional || '—' }}</dd>
                </div>
                <div>
                  <dt>Ciclo formativo</dt>
                  <dd>{{ a.preferencias?.cicloFormativo || '—' }}</dd>
                </div>
                <div>
                  <dt>Localidad</dt>
                  <dd>{{ a.preferencias?.localidad || '—' }}</dd>
                </div>
                <div>
                  <dt>Modalidad</dt>
                  <dd>{{ a.preferencias?.modalidad || '—' }}</dd>
                </div>
                <div>
                  <dt>Disponibilidad</dt>
                  <dd>{{ formatFecha(a.preferencias?.fechaDisponibilidad) || '—' }}</dd>
                </div>
              </dl>

              <div class="alumno-solicitudes" aria-label="Resumen de solicitudes">
                <div class="counter">
                  <span class="counter-value">{{ a.solicitudes.total }}</span>
                  <span class="counter-label">Total</span>
                </div>
                <div class="counter counter-warn">
                  <span class="counter-value">{{ a.solicitudes.solicitadas }}</span>
                  <span class="counter-label">Pendientes</span>
                </div>
                <div class="counter counter-ok">
                  <span class="counter-value">{{ a.solicitudes.aceptadas }}</span>
                  <span class="counter-label">Aceptadas</span>
                </div>
                <div class="counter counter-bad">
                  <span class="counter-value">{{ a.solicitudes.rechazadas }}</span>
                  <span class="counter-label">Rechazadas</span>
                </div>
              </div>

              @if (a.asignacionActual) {
                <section class="asignacion-actual" aria-label="Asignación actual">
                  <p class="eyebrow">Asignación actual</p>
                  <p class="asignacion-line">
                    <strong>{{ a.asignacionActual.empresa }}</strong> · {{ a.asignacionActual.oferta }}
                  </p>
                  <p class="muted">
                    Desde {{ formatFecha(a.asignacionActual.fechaAsignacion) }}
                  </p>
                </section>
              } @else if (a.asignacionPendiente) {
                <section class="asignacion-pendiente" aria-label="Asignación pendiente">
                  <div>
                    <p class="eyebrow">Lista para asignar</p>
                    <p class="asignacion-line">
                      <strong>{{ a.asignacionPendiente.empresa }}</strong> ·
                      {{ a.asignacionPendiente.oferta }}
                    </p>
                    <p class="muted">
                      Aceptada el {{ formatFecha(a.asignacionPendiente.aceptadaEn) }}
                    </p>
                  </div>
                  <button type="button" class="assign-button" (click)="openAssignModal(a)">
                    Asignar
                  </button>
                </section>
              }
            </article>
          }
        </section>
      }
      @if (selectedDetailAlumno(); as alumno) {
        <section class="modal-backdrop" role="presentation" (click)="closeAlumnoDetail()">
          <article
            class="confirm-modal detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-detail-title"
            (click)="$event.stopPropagation()"
          >
            <header class="student-detail-header">
              <span class="student-avatar detail-avatar" [class.has-photo]="!!alumno.photoDataUrl">
                @if (alumno.photoDataUrl) {
                  <img [src]="alumno.photoDataUrl" [alt]="'Foto de ' + alumno.displayName" />
                } @else {
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4Zm0 2c-3.4 0-6.4 1.7-8 4.4.8 1 3.4 1.6 8 1.6s7.2-.6 8-1.6c-1.6-2.7-4.6-4.4-8-4.4Z" />
                  </svg>
                }
              </span>
              <div>
                <h2 id="student-detail-title">{{ alumno.displayName }}</h2>
                <p class="alumno-email">{{ alumno.email }}</p>
              </div>
            </header>

            <dl class="detail-grid">
              <div>
                <dt>Correo del centro</dt>
                <dd>{{ alumno.centroEmail || '—' }}</dd>
              </div>
              <div>
                <dt>Estado de cuenta</dt>
                <dd>{{ alumno.enabled ? 'Activa' : 'Deshabilitada' }}</dd>
              </div>
              <div>
                <dt>Estado FCT</dt>
                <dd>{{ alumno.asignacionActual ? estadoLabel(alumno.asignacionActual.estado) : 'Sin asignación' }}</dd>
              </div>
              <div>
                <dt>Familia profesional</dt>
                <dd>{{ alumno.preferencias?.familiaProfesional || '—' }}</dd>
              </div>
              <div>
                <dt>Ciclo formativo</dt>
                <dd>{{ alumno.preferencias?.cicloFormativo || '—' }}</dd>
              </div>
              <div>
                <dt>Localidad preferida</dt>
                <dd>{{ alumno.preferencias?.localidad || '—' }}</dd>
              </div>
              <div>
                <dt>Modalidad preferida</dt>
                <dd>{{ modalidadLabel(alumno.preferencias?.modalidad) }}</dd>
              </div>
              <div>
                <dt>Disponibilidad</dt>
                <dd>{{ formatFecha(alumno.preferencias?.fechaDisponibilidad) || '—' }}</dd>
              </div>
              <div>
                <dt>Solicitudes</dt>
                <dd>
                  {{ alumno.solicitudes.total }} total ·
                  {{ alumno.solicitudes.solicitadas }} pendientes ·
                  {{ alumno.solicitudes.aceptadas }} aceptadas ·
                  {{ alumno.solicitudes.rechazadas }} rechazadas
                </dd>
              </div>
              <div class="detail-full">
                <dt>Observaciones del alumno</dt>
                <dd>{{ alumno.preferencias?.observaciones || '—' }}</dd>
              </div>
              @if (alumno.asignacionActual; as asig) {
                <div class="detail-full">
                  <dt>Asignación actual</dt>
                  <dd>
                    {{ asig.empresa }} · {{ asig.oferta }} · Desde {{ formatFecha(asig.fechaAsignacion) }}
                  </dd>
                </div>
                <div class="detail-full">
                  <dt>Horas y fecha de inicio</dt>
                  <dd>
                    {{ asig.horasTotales }} h totales · Inicio {{ formatFechaInicio(asig.fechaInicio) }}
                    · Jornada estimada {{ asig.horasDiariasEstimadas }} h/día
                  </dd>
                </div>
                <div class="detail-full">
                  <dt>Retribución</dt>
                  <dd>
                    @if (asig.remunerada) {
                      Remunerada@if (asig.importeMensual != null) { · {{ formatImporte(asig.importeMensual) }}/mes }
                      @if (asig.observacionesRetribucion) { · {{ asig.observacionesRetribucion }} }
                    } @else {
                      No remunerada
                    }
                  </dd>
                </div>
                <div class="detail-full">
                  <dt>Progreso estimado</dt>
                  <dd>
                    <div class="asignacion-progress" aria-label="Progreso estimado de FCT">
                      <div class="progress-head">
                        <strong>{{ progressFor(asig).percent }}% completado</strong>
                        <span>{{ progressLabel(asig) }}</span>
                      </div>
                      <div class="progress-bar">
                        <span [style.width.%]="progressFor(asig).percent"></span>
                      </div>
                      <p class="progress-meta">
                        Estimación basada en {{ asig.horasDiariasEstimadas }} h/día laborable. No es un cómputo oficial.
                      </p>
                    </div>
                  </dd>
                </div>
              } @else if (alumno.asignacionPendiente) {
                <div class="detail-full">
                  <dt>Asignación pendiente</dt>
                  <dd>
                    {{ alumno.asignacionPendiente.empresa }} · {{ alumno.asignacionPendiente.oferta }}
                    · {{ alumno.asignacionPendiente.tipo === 'INTERNA' ? 'Oferta interna' : 'Oferta externa' }}
                  </dd>
                </div>
              }
            </dl>

            <section class="cv-detail-panel" aria-label="CV del alumno">
              <div>
                <p class="eyebrow">CV</p>
                @if (alumno.hasCv) {
                  <p class="cv-detail-title">{{ alumno.cvFileName || 'CV del alumno' }}</p>
                  <p class="muted">{{ cvSummary(alumno) }}</p>
                } @else {
                  <p class="muted">El alumno aún no ha subido CV.</p>
                }
              </div>
              @if (alumno.hasCv) {
                <div class="cv-detail-actions">
                  <button
                    type="button"
                    class="secondary-button"
                    [disabled]="cvActionStatus() === 'loading'"
                    (click)="previewCv(alumno)"
                  >
                    Previsualizar
                  </button>
                  <button
                    type="button"
                    class="primary-button"
                    [disabled]="cvActionStatus() === 'loading'"
                    (click)="downloadCv(alumno)"
                  >
                    Descargar
                  </button>
                </div>
              }
            </section>

            @if (cvActionStatus() === 'error') {
              <p class="modal-error" role="alert">{{ cvActionError() }}</p>
            }
            @if (chatError(); as msg) {
              <p class="modal-error" role="alert">{{ msg }}</p>
            }

            <div class="modal-actions">
              <button type="button" class="secondary-button" (click)="closeAlumnoDetail()">
                Cerrar
              </button>
              <button
                type="button"
                class="primary-button chat-action"
                [disabled]="openingChatForAlumnoId() !== null"
                (click)="openAlumnoChat(alumno)"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" class="chat-icon">
                  <path d="M2 21l1.65-4.95A9 9 0 1 1 7 19.46L2 21Zm15-7a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm-5 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm-5 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/>
                </svg>
                {{ openingChatForAlumnoId() === alumno.id ? 'Abriendo...' : 'Enviar mensaje' }}
              </button>
            </div>
          </article>
        </section>
      }

      @if (selectedAlumno(); as alumno) {
        <section class="modal-backdrop" role="presentation" (click)="closeAssignModal()">
          <article
            class="confirm-modal assign-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-modal-title"
            (click)="$event.stopPropagation()"
          >
            <p class="eyebrow">Confirmar asignación</p>
            <h2 id="assign-modal-title">Asignar empresa de prácticas</h2>
            @if (alumno.asignacionPendiente; as pendiente) {
              <dl class="confirm-details">
                <div>
                  <dt>Alumno</dt>
                  <dd>{{ alumno.displayName }}</dd>
                </div>
                <div>
                  <dt>Correo del centro</dt>
                  <dd>{{ alumno.centroEmail || alumno.email }}</dd>
                </div>
                <div>
                  <dt>Oferta</dt>
                  <dd>{{ pendiente.oferta }}</dd>
                </div>
                <div>
                  <dt>Empresa</dt>
                  <dd>{{ pendiente.empresa }}</dd>
                </div>
                <div>
                  <dt>Tipo</dt>
                  <dd>{{ pendiente.tipo === 'INTERNA' ? 'Oferta interna' : 'Oferta externa' }}</dd>
                </div>
                <div>
                  <dt>Localidad</dt>
                  <dd>{{ pendiente.localidad || '—' }}</dd>
                </div>
              </dl>
              <form [formGroup]="assignForm" class="assign-form" (ngSubmit)="confirmAssign(alumno)">
                <div class="assign-grid">
                  <label class="assign-field">
                    <span class="assign-label">Horas totales de FCT</span>
                    <input
                      type="number"
                      min="40"
                      max="1000"
                      step="1"
                      formControlName="horasTotales"
                      autocomplete="off"
                    />
                    <small class="assign-hint">Entre 40 y 1000 horas.</small>
                  </label>
                  <label class="assign-field">
                    <span class="assign-label">Fecha real de inicio</span>
                    <input type="date" formControlName="fechaInicio" />
                    <small class="assign-hint">Fecha en la que el alumno empieza en la empresa.</small>
                  </label>
                  <label class="assign-field">
                    <span class="assign-label">Jornada estimada (h/día laborable)</span>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      step="1"
                      formControlName="horasDiariasEstimadas"
                    />
                    <small class="assign-hint">Sirve para estimar el % de FCT completada.</small>
                  </label>
                  <label class="assign-toggle assign-field--wide">
                    <span>Prácticas remuneradas</span>
                    <input type="checkbox" formControlName="remunerada" />
                  </label>
                  @if (assignForm.controls.remunerada.value) {
                    <label class="assign-field">
                      <span class="assign-label">Importe mensual (€)</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        formControlName="importeMensual"
                        placeholder="Opcional"
                      />
                      <small class="assign-hint">Déjalo vacío si es variable.</small>
                    </label>
                    <label class="assign-field">
                      <span class="assign-label">Observaciones de retribución</span>
                      <textarea
                        rows="2"
                        maxlength="2000"
                        formControlName="observacionesRetribucion"
                        placeholder="Beca, dietas, etc. (Opcional)"
                      ></textarea>
                    </label>
                  }
                  <label class="assign-field assign-field--wide">
                    <span class="assign-label">Observaciones generales</span>
                    <textarea
                      rows="2"
                      maxlength="2000"
                      formControlName="observaciones"
                      placeholder="Opcional"
                    ></textarea>
                  </label>
                </div>
              </form>
              <p class="modal-note">
                Al confirmar, este alumno quedará marcado como asignado y no podrá recibir otra
                empresa mientras exista esta asignación activa.
              </p>
            }
            @if (assignStatus() === 'error') {
              <p class="modal-error" role="alert">{{ assignError() }}</p>
            }
            <div class="modal-actions assign-modal-actions">
              @if (alumno.asignacionPendiente; as pendiente) {
                <button
                  type="button"
                  class="link-button"
                  (click)="openOferta(pendiente)"
                >
                  Ver oferta
                </button>
              }
              <div class="modal-actions-right">
                <button
                  type="button"
                  class="secondary-button"
                  [disabled]="assignStatus() === 'assigning'"
                  (click)="closeAssignModal()"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  class="primary-button"
                  [disabled]="assignStatus() === 'assigning' || assignForm.invalid"
                  (click)="confirmAssign(alumno)"
                >
                  {{ assignStatus() === 'assigning' ? 'Asignando...' : 'Confirmar asignación' }}
                </button>
              </div>
            </div>
          </article>
        </section>
      }
      @if (isCreateAlumnoModalOpen()) {
        <section class="modal-backdrop" role="presentation" (click)="closeCreateAlumnoModal()">
          <article
            class="confirm-modal create-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-alumno-title"
            (click)="$event.stopPropagation()"
          >
            <form [formGroup]="createAlumnoForm" (ngSubmit)="submitCreateAlumno()">
              <p class="eyebrow">Nueva cuenta</p>
              <h2 id="create-alumno-title">Crear alumno</h2>
              <div class="create-form-grid">
                <label class="filter-control create-field">
                  <span>Nombre completo</span>
                  <input type="text" formControlName="displayName" autocomplete="name" />
                  <small
                    class="field-hint"
                    [class.is-empty]="!(createAlumnoForm.controls.displayName.touched && createAlumnoForm.controls.displayName.invalid)"
                  >El nombre es obligatorio.</small>
                </label>
                <label class="filter-control create-field">
                  <span>Username</span>
                  <div class="username-field">
                    <input
                      type="text"
                      formControlName="username"
                      placeholder="nombre.apellido"
                      autocomplete="username"
                    />
                    <span>@fctnow.com</span>
                  </div>
                  <small
                    class="field-hint"
                    [class.is-empty]="!(createAlumnoForm.controls.username.touched && createAlumnoForm.controls.username.invalid)"
                  >Usa solo letras, numeros, punto, guion o guion bajo.</small>
                </label>
                <label class="filter-control create-field">
                  <span>Password inicial</span>
                  <input type="password" formControlName="password" autocomplete="new-password" />
                  <small
                    class="field-hint"
                    [class.is-empty]="!(createAlumnoForm.controls.password.touched && createAlumnoForm.controls.password.invalid)"
                  >Minimo 8 caracteres.</small>
                </label>
                <label class="filter-control create-field">
                  <span>Correo del centro</span>
                  <div class="centro-email-field">
                    <input
                      type="text"
                      formControlName="centroEmail"
                      placeholder="ialumno"
                      autocomplete="off"
                      [attr.aria-describedby]="'centro-email-hint'"
                    />
                    <span>&#64;elpuig.xeill.net</span>
                  </div>
                  <small
                    id="centro-email-hint"
                    class="field-hint"
                    [class.is-empty]="!(createAlumnoForm.controls.centroEmail.touched && createAlumnoForm.controls.centroEmail.invalid)"
                  >Inicial del nombre + primer apellido. Aquí se enviarán los datos de acceso.</small>
                </label>
              </div>
              @if (createAlumnoStatus() === 'error') {
                <p class="modal-error" role="alert">{{ createAlumnoError() }}</p>
              }
              <div class="modal-actions">
                <button
                  type="button"
                  class="secondary-button"
                  [disabled]="createAlumnoStatus() === 'saving'"
                  (click)="closeCreateAlumnoModal()"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  class="primary-button"
                  [disabled]="createAlumnoStatus() === 'saving'"
                >
                  {{ createAlumnoStatus() === 'saving' ? 'Creando...' : 'Crear alumno' }}
                </button>
              </div>
            </form>
          </article>
        </section>
      }
    </main>
  `,
  styles: [
    `
      .tutor-page {
        display: grid;
        align-content: start;
        gap: 1.4rem;
        padding-top: 2rem;
      }

      .kpi-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      }

      .kpi-card {
        padding: 1rem 1.1rem;
        border-radius: var(--radius-md);
        background: var(--surface);
        border: 1px solid rgba(17, 78, 74, 0.15);
        box-shadow: 0 6px 18px rgba(17, 78, 74, 0.06);
        display: grid;
        gap: 0.35rem;
      }

      .kpi-card.kpi-warn {
        border-color: rgba(146, 64, 14, 0.3);
        background: var(--warning-soft);
      }

      :host-context(.theme-dark) .kpi-card.kpi-warn {
        border-color: rgba(241, 197, 106, 0.4);
      }

      .kpi-value {
        margin: 0;
        font-size: 2rem;
        font-weight: 800;
        line-height: 1;
        color: var(--ink);
      }

      .kpi-total {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--muted);
        margin-left: 0.15rem;
      }

      .filters-panel,
      .actions-panel,
      .state-panel {
        padding: 1.1rem 1.2rem;
        border-radius: var(--radius-md);
        background: var(--surface);
        border: 1px solid rgba(17, 78, 74, 0.15);
      }

      .actions-panel {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 0.85rem;
      }

      .actions-panel h2 {
        margin: 0.15rem 0 0;
        font-size: 1.2rem;
      }

      .actions-row {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 0.55rem;
      }

      .file-import-label {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .file-import-label input {
        position: absolute;
        inline-size: 1px;
        block-size: 1px;
        opacity: 0;
        pointer-events: none;
      }

      .file-import-label.is-disabled {
        cursor: progress;
        opacity: 0.7;
      }

      .compact-alert {
        grid-column: 1 / -1;
      }

      .import-result {
        grid-column: 1 / -1;
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem 0.85rem;
        color: var(--muted);
        font-size: 0.9rem;
      }

      .import-result strong {
        color: var(--success);
      }

      .import-result ul {
        flex: 1 0 100%;
        margin: 0.15rem 0 0;
        padding-left: 1.1rem;
      }

      .import-result li[data-estado='ERROR'] {
        color: #8a3a26;
      }

      .state-panel.alert {
        border-color: rgba(146, 64, 14, 0.3);
        background: var(--warning-soft);
      }

      :host-context(.theme-dark) .state-panel.alert {
        border-color: rgba(241, 197, 106, 0.4);
      }

      .filters-row {
        display: grid;
        grid-template-columns:
          minmax(12rem, 1fr)
          minmax(9rem, 0.8fr)
          minmax(13rem, 1fr)
          minmax(13rem, 1fr)
          auto
          10.75rem;
        align-items: end;
        gap: 1rem;
      }

      .filter-control {
        display: grid;
        gap: 0.3rem;
        min-width: 0;
        font-size: 0.85rem;
        color: var(--muted);
      }

      .filter-control input,
      .filter-control select {
        min-height: 2.4rem;
        padding: 0 0.6rem;
        border-radius: var(--radius-md);
        border: 1px solid var(--line);
        background: var(--canvas-deep);
        color: var(--ink);
        font: inherit;
        width: 100%;
        min-width: 0;
      }

      .view-toggle {
        width: 10.75rem;
        min-height: 2.4rem;
        display: grid;
        grid-template-columns: repeat(2, minmax(5rem, 1fr));
        padding: 0.18rem;
        border-radius: var(--radius-md);
        background: rgba(17, 78, 74, 0.08);
        border: 1px solid rgba(17, 78, 74, 0.16);
      }

      .view-toggle button {
        border: 0;
        border-radius: var(--radius-sm);
        background: transparent;
        color: var(--muted);
        font: inherit;
        font-size: 0.82rem;
        font-weight: 800;
        cursor: pointer;
      }

      .view-toggle button.is-active {
        background: var(--surface);
        color: var(--accent);
        box-shadow: 0 4px 12px rgba(17, 78, 74, 0.12);
      }

      .view-toggle button:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }

      .clear-filters-button {
        min-height: 2.4rem;
        padding: 0 0.85rem;
        border-radius: var(--radius-md);
        border: 1px solid var(--line);
        background: var(--surface-muted);
        color: var(--accent);
        font: inherit;
        font-size: 0.85rem;
        font-weight: 800;
        cursor: pointer;
        white-space: nowrap;
      }

      .clear-filters-button:disabled {
        cursor: default;
        opacity: 0.45;
      }

      .clear-filters-button:not(:disabled):hover,
      .clear-filters-button:not(:disabled):focus-visible {
        background: var(--accent-soft);
        outline: none;
      }

      .alumno-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
        align-items: start;
      }

      .alumno-list {
        display: grid;
        gap: 0.7rem;
      }

      .alumno-row {
        padding: 0.85rem 1rem;
        border-radius: var(--radius-md);
        background: var(--surface);
        border: 1px solid rgba(17, 78, 74, 0.15);
        display: grid;
        gap: 0.65rem;
        min-width: 0;
        overflow: hidden;
      }

      .alumno-row.is-assigned {
        background: var(--success-soft);
        border-color: rgba(29, 107, 74, 0.35);
      }

      .alumno-row.is-pending {
        background: var(--warning-soft);
        border-color: rgba(138, 90, 0, 0.32);
      }

      :host-context(.theme-dark) .alumno-row.is-assigned {
        border-color: rgba(139, 216, 169, 0.42);
      }

      :host-context(.theme-dark) .alumno-row.is-pending {
        border-color: rgba(241, 197, 106, 0.42);
      }

      .row-main {
        display: flex;
        gap: 0.6rem;
        align-items: center;
        min-width: 0;
      }

      .student-cell h3,
      .alumno-card-heading h3 {
        margin: 0;
        font-size: 1.1rem;
      }

      .status-cell {
        flex: 0 0 8.5rem;
        min-width: 0;
        display: flex;
        justify-content: center !important;
      }

      .status-cell .estado-pill {
        flex-shrink: 1;
      }

      .row-details {
        flex: 1 1 22rem;
        min-width: 0;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.65rem;
        margin: 0;
      }

      .row-details dt {
        margin: 0;
        color: var(--muted);
        font-size: 0.68rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .row-details dd {
        margin: 0.15rem 0 0;
        font-size: 0.9rem;
        font-weight: 700;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .row-counters {
        flex: 0 0 auto;
        display: grid;
        grid-template-columns: repeat(4, 2rem);
        justify-content: end;
        gap: 0.3rem;
        max-width: 100%;
        min-width: 0;
      }

      .row-counters span {
        min-width: 0;
        min-height: 2rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.42rem;
        background: rgba(17, 78, 74, 0.06);
        font-weight: 900;
        font-size: 0.88rem;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .row-counters span:nth-child(2) {
        background: rgba(87, 96, 106, 0.18);
      }

      .row-counters span:nth-child(3) {
        background: rgba(29, 107, 74, 0.18);
        color: var(--success);
      }

      .row-counters span:nth-child(4) {
        background: rgba(179, 38, 30, 0.18);
        color: #8a3a26;
      }

      .row-assignment {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem 0.75rem;
        align-items: center;
        padding-top: 0.65rem;
        border-top: 1px solid rgba(17, 78, 74, 0.12);
        color: var(--muted);
        font-size: 0.88rem;
      }

      .row-assignment > span:first-child {
        color: var(--accent);
        font-size: 0.72rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .row-assignment strong {
        color: var(--ink);
      }

      .row-assignment.is-pending {
        justify-content: flex-start;
      }

      .row-assignment .assign-button {
        margin-left: auto;
      }

      .alumno-card {
        padding: 1rem 1.1rem;
        border-radius: var(--radius-md);
        background: var(--surface);
        border: 1px solid rgba(17, 78, 74, 0.15);
        display: grid;
        gap: 0.85rem;
        align-content: start;
        min-width: 0;
        overflow: hidden;
      }

      .alumno-card.is-assigned {
        background: var(--success-soft);
        border-color: rgba(29, 107, 74, 0.42);
        box-shadow: 0 12px 28px rgba(29, 107, 74, 0.12);
      }

      :host-context(.theme-dark) .alumno-card.is-assigned {
        border-color: rgba(139, 216, 169, 0.42);
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.32);
      }

      .alumno-card.is-pending {
        background: var(--warning-soft);
        border-color: rgba(138, 90, 0, 0.36);
        box-shadow: 0 12px 28px rgba(138, 90, 0, 0.1);
      }

      :host-context(.theme-dark) .alumno-card.is-pending {
        border-color: rgba(241, 197, 106, 0.42);
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.32);
      }

      .alumno-card-heading {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.75rem;
        min-width: 0;
        overflow: hidden;
      }

      .alumno-card-heading .card-student-cell {
        flex: 1 1 0;
        min-width: 0;
      }

      .alumno-card-heading .estado-pill {
        flex: 0 1 auto;
        max-width: min(8.5rem, 42%);
      }

      .alumno-details {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.5rem;
        margin: 0;
      }

      .alumno-details dt {
        margin: 0;
        font-size: 0.7rem;
        font-weight: 800;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .alumno-details dd {
        margin: 0.15rem 0 0;
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .alumno-solicitudes {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 4.75rem), 1fr));
        gap: 0.4rem;
        max-width: 100%;
        min-width: 0;
      }

      .counter {
        width: 100%;
        min-width: 0;
        padding: 0.45rem 0.35rem;
        border-radius: var(--radius-md);
        background: rgba(17, 78, 74, 0.06);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        gap: 0.15rem;
        overflow: hidden;
      }

      .counter-value {
        max-width: 100%;
        font-weight: 800;
        font-size: 1.05rem;
        line-height: 1;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .counter-label {
        font-size: 0.62rem;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .counter-warn {
        background: rgba(87, 96, 106, 0.18);
      }

      .counter-ok {
        background: rgba(29, 107, 74, 0.18);
        color: var(--success);
      }

      .counter-bad {
        background: rgba(179, 38, 30, 0.18);
        color: #8a3a26;
      }

      .asignacion-actual {
        padding: 0.7rem 0.9rem;
        background: rgba(17, 78, 74, 0.05);
        border-radius: var(--radius-md);
        display: grid;
        gap: 0.2rem;
        min-width: 0;
        overflow: hidden;
      }

      .asignacion-pendiente {
        padding: 0.8rem 0.9rem;
        border-radius: var(--radius-md);
        background: var(--surface);
        border: 1px solid var(--line);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.85rem;
        min-width: 0;
        overflow: hidden;
        flex-wrap: wrap;
      }

      .asignacion-pendiente > div {
        flex: 1 1 12rem;
        min-width: 0;
      }

      .asignacion-line {
        margin: 0;
        font-weight: 700;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .muted {
        color: var(--muted);
        margin: 0;
      }

      .assign-button,
      .primary-button,
      .secondary-button {
        min-height: 2.35rem;
        min-width: 6rem;
        border: 0;
        border-radius: var(--radius-md);
        padding: 0 1rem;
        font: inherit;
        font-weight: 800;
        white-space: nowrap;
        cursor: pointer;
      }

      .assign-button,
      .primary-button {
        background: var(--accent);
        color: #fff;
      }

      .secondary-button {
        background: rgba(17, 78, 74, 0.08);
        color: var(--accent);
      }

      .assign-button:hover,
      .assign-button:focus-visible,
      .primary-button:hover,
      .primary-button:focus-visible {
        background: #0b4f4a;
        outline: none;
      }

      .secondary-button:hover,
      .secondary-button:focus-visible {
        background: rgba(17, 78, 74, 0.14);
        outline: none;
      }

      button:disabled {
        cursor: progress;
        opacity: 0.7;
      }

      .modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 20;
        display: grid;
        place-items: center;
        overflow-y: auto;
        padding: 1rem;
        background: rgba(9, 24, 31, 0.46);
      }

      .confirm-modal {
        width: min(100%, 34rem);
        border-radius: var(--radius-md);
        padding: 1.25rem;
        background: var(--surface-strong, #fffaf2);
        border: 1px solid rgba(17, 78, 74, 0.18);
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.24);
        display: grid;
        gap: 1rem;
      }

      .confirm-modal.assign-modal {
        width: min(100%, 56rem);
      }

      .assign-modal .confirm-details {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .assign-modal-actions {
        justify-content: flex-start;
        align-items: center;
      }

      .modal-actions-right {
        display: flex;
        gap: 0.65rem;
        margin-left: auto;
      }

      .link-button {
        background: transparent;
        border: 0;
        padding: 0;
        font: inherit;
        font-weight: 700;
        color: var(--accent);
        text-decoration: underline;
        cursor: pointer;
      }

      .link-button:hover,
      .link-button:focus-visible {
        color: var(--accent-hover);
        outline: none;
      }

      .confirm-modal.detail-modal {
        width: min(72rem, calc(100vw - 2rem));
        max-height: min(calc(100dvh - 2rem), 52rem);
        padding: 1rem;
        gap: 0.75rem;
      }

      .assign-form{display:contents}
      .assign-grid{display:grid;gap:.85rem 1rem;grid-template-columns:repeat(2,minmax(0,1fr));align-items:start}
      .assign-field{display:grid;grid-template-rows:1.2rem 2.4rem 1.05rem;gap:.3rem;font-size:.85rem;color:var(--muted);align-content:start}
      .assign-field--wide{grid-column:1/-1;grid-template-rows:1.2rem auto auto}
      .assign-label{font-weight:700;color:var(--ink);line-height:1.2rem}
      .assign-field>input,.assign-field>textarea{height:2.4rem;padding:.4rem .65rem;border:1px solid var(--line);border-radius:var(--radius-md);background:var(--surface);color:inherit;font:inherit;box-sizing:border-box}
      .assign-field>textarea{height:auto;min-height:4.2rem;padding:.5rem .65rem;resize:vertical}
      .assign-hint{font-size:.72rem;color:var(--muted);line-height:1.05rem;min-height:1.05rem;margin:0}
      .assign-toggle{display:flex;align-items:center;justify-content:space-between;gap:.75rem;padding:.55rem .8rem;border:1px solid var(--line);border-radius:var(--radius-md);background:rgba(17,78,74,.04);font-weight:700;color:var(--ink)}
      .assign-toggle input[type='checkbox']{width:1.1rem;height:1.1rem;margin:0}
      .asignacion-progress { display: grid; gap: 0.25rem; }
      .asignacion-progress .progress-bar { height: 0.4rem; border-radius: 999px; overflow: hidden; background: rgba(17, 78, 74, 0.12); }
      .asignacion-progress .progress-bar > span { display: block; height: 100%; background: var(--accent); }
      .asignacion-progress .progress-head { display: flex; justify-content: space-between; font-size: 0.85rem; }
      .asignacion-progress .progress-meta { font-size: 0.72rem; color: var(--muted); margin: 0; }

      .create-modal {
        width: min(46rem, calc(100vw - 2rem));
      }

      .create-modal form {
        display: grid;
        gap: 1rem;
      }

      .create-form-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.75rem;
        align-items: start;
      }

      .create-field {
        align-content: start;
        grid-template-rows: auto auto auto;
      }

      .create-field .field-hint {
        min-height: 1.05rem;
        line-height: 1.05rem;
      }

      .create-field .field-hint.is-empty {
        visibility: hidden;
      }

      .username-field,
      .centro-email-field {
        min-height: 2.4rem;
        border-radius: var(--radius-md);
        border: 1px solid var(--line);
        background: var(--canvas-deep);
        display: flex;
        align-items: center;
        overflow: hidden;
      }

      .username-field input,
      .centro-email-field input {
        border: 0;
        border-radius: 0;
      }

      .username-field input:focus,
      .centro-email-field input:focus {
        outline: none;
      }

      .username-field span,
      .centro-email-field span {
        padding: 0 0.65rem;
        color: var(--muted);
        font-weight: 800;
        white-space: nowrap;
        border-left: 1px solid var(--line);
      }


      .filter-control small {
        color: #8a3a26;
        font-weight: 700;
      }

      .confirm-modal h2 {
        margin: 0;
      }

      .confirm-details {
        margin: 0;
        display: grid;
        gap: 0.7rem;
      }

      .confirm-details div {
        padding: 0.7rem 0.8rem;
        border-radius: var(--radius-md);
        background: rgba(17, 78, 74, 0.06);
      }

      .confirm-details dt {
        margin: 0;
        color: var(--muted);
        font-size: 0.72rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .confirm-details dd {
        margin: 0.2rem 0 0;
        font-weight: 700;
      }

      .modal-note,
      .modal-error {
        margin: 0;
        font-size: 0.9rem;
      }

      .modal-note {
        color: var(--muted);
      }

      .modal-error {
        padding: 0.7rem 0.8rem;
        border-radius: var(--radius-md);
        background: rgba(179, 38, 30, 0.12);
        color: #8a3a26;
        font-weight: 700;
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.65rem;
      }

      .chat-action {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
      }

      .chat-icon {
        width: 1.05rem;
        height: 1.05rem;
        fill: currentColor;
      }

      @media (max-width: 980px) {
        .actions-panel {
          grid-template-columns: 1fr;
        }

        .actions-row {
          justify-content: flex-start;
        }

        .filters-row {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .clear-filters-button,
        .view-toggle {
          width: 100%;
        }

        .row-main {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 8.5rem;
          row-gap: 0.85rem;
        }

        .row-details,
        .row-counters {
          grid-column: 1 / -1;
        }

        .row-counters {
          justify-content: start;
        }
      }

      @media (max-width: 680px) {
        .actions-row,
        .actions-row button,
        .file-import-label {
          width: 100%;
        }

        .create-form-grid {
          grid-template-columns: 1fr;
        }

        .filter-control,
        .view-toggle {
          width: 100%;
        }

        .row-main,
        .row-details {
          grid-template-columns: 1fr;
        }

        .status-cell {
          justify-content: flex-start !important;
        }

        .row-assignment .assign-button {
          width: 100%;
          margin-left: 0;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TutorPage implements OnInit {
  private readonly tutorService = inject(TutorAlumnosService);
  private readonly cache = inject(TutorCacheService);
  private readonly asignacionesService = inject(AsignacionesService);
  private readonly asignacionesExternasService = inject(AsignacionesExternasService);
  private readonly mensajesService = inject(MensajesService);
  private readonly mensajesCache = inject(MensajesCacheService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  protected readonly currentUserName = computed(
    () => this.authService.currentUser()?.displayName ?? null,
  );

  protected readonly status = signal<LoadStatus>('loading');
  protected readonly errorMessage = signal<string>('');
  protected readonly alumnos = signal<TutorAlumno[]>([]);
  protected readonly selectedAlumno = signal<TutorAlumno | null>(null);
  protected readonly selectedDetailAlumno = signal<TutorAlumno | null>(null);
  protected readonly assignStatus = signal<AssignStatus>('idle');
  protected readonly assignError = signal<string>('');
  protected readonly cvActionStatus = signal<CvActionStatus>('idle');
  protected readonly cvActionError = signal<string>('');
  protected readonly isCreateAlumnoModalOpen = signal(false);
  protected readonly createAlumnoStatus = signal<CreateAlumnoStatus>('idle');
  protected readonly createAlumnoError = signal<string>('');
  protected readonly importStatus = signal<ImportStatus>('idle');
  protected readonly importError = signal<string>('');
  protected readonly importResult = signal<TutorAlumnoImportResult | null>(null);
  protected readonly viewMode = signal<ViewMode>('list');
  protected readonly openingChatForAlumnoId = signal<number | null>(null);
  protected readonly chatError = signal<string>('');

  protected readonly searchFilter = new FormControl<string>('', { nonNullable: true });
  protected readonly estadoFilter = new FormControl<
    'TODOS' | 'ASIGNADO' | 'SIN_ASIGNAR' | 'LISTO_PARA_ASIGNAR'
  >('TODOS', { nonNullable: true });
  protected readonly familiaFilter = new FormControl<string>('TODAS', { nonNullable: true });
  protected readonly cicloFilter = new FormControl<string>('TODOS', { nonNullable: true });
  protected readonly assignForm = new FormGroup({
    horasTotales: new FormControl<number | null>(400, {
      validators: [Validators.required, Validators.min(40), Validators.max(1000)],
    }),
    fechaInicio: new FormControl<string>(todayIso(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    horasDiariasEstimadas: new FormControl<number | null>(7, {
      validators: [Validators.required, Validators.min(1), Validators.max(12)],
    }),
    remunerada: new FormControl<boolean>(false, { nonNullable: true }),
    importeMensual: new FormControl<number | null>(null, {
      validators: [Validators.min(0)],
    }),
    observacionesRetribucion: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.maxLength(2000)],
    }),
    observaciones: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.maxLength(2000)],
    }),
  });

  protected readonly createAlumnoForm = new FormGroup({
    displayName: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
    username: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(180),
        Validators.pattern(/^[a-zA-Z0-9._-]+$/),
      ],
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8), Validators.maxLength(100)],
    }),
    centroEmail: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(180),
        Validators.pattern(/^[a-zA-Z0-9._-]+$/),
      ],
    }),
  });
  private readonly searchValue = signal<string>('');
  private readonly estadoValue = signal<
    'TODOS' | 'ASIGNADO' | 'SIN_ASIGNAR' | 'LISTO_PARA_ASIGNAR'
  >('TODOS');
  private readonly familiaValue = signal<string>('TODAS');
  private readonly cicloValue = signal<string>('TODOS');

  protected readonly totalAsignados = computed(
    () => this.alumnos().filter((a) => !!a.asignacionActual).length,
  );
  protected readonly totalAceptados = computed(
    () => this.alumnos().filter((a) => a.solicitudes.aceptadas > 0).length,
  );
  protected readonly totalSolicitudesPendientes = computed(() =>
    this.alumnos().reduce((sum, a) => sum + a.solicitudes.solicitadas, 0),
  );
  protected readonly familiasDisponibles = computed(() =>
    distinctSorted(this.alumnos().map((a) => a.preferencias?.familiaProfesional)),
  );
  protected readonly ciclosDisponibles = computed(() =>
    distinctSorted(this.alumnos().map((a) => a.preferencias?.cicloFormativo)),
  );
  protected readonly hasActiveFilters = computed(
    () =>
      !!this.searchValue().trim() ||
      this.estadoValue() !== 'TODOS' ||
      this.familiaValue() !== 'TODAS' ||
      this.cicloValue() !== 'TODOS',
  );
  protected readonly importPreviewRows = computed(() => this.importResult()?.filas.slice(0, 6) ?? []);

  protected readonly filteredAlumnos = computed(() => {
    const q = this.searchValue().trim().toLowerCase();
    const estado = this.estadoValue();
    const familia = this.familiaValue();
    const ciclo = this.cicloValue();
    return this.alumnos().filter((a) => {
      if (estado === 'ASIGNADO' && !a.asignacionActual) return false;
      if (estado === 'SIN_ASIGNAR' && a.asignacionActual) return false;
      if (
        estado === 'LISTO_PARA_ASIGNAR' &&
        (!a.asignacionPendiente || !!a.asignacionActual)
      ) {
        return false;
      }
      if (
        familia !== 'TODAS' &&
        normalizeOption(a.preferencias?.familiaProfesional) !== normalizeOption(familia)
      ) {
        return false;
      }
      if (
        ciclo !== 'TODOS' &&
        normalizeOption(a.preferencias?.cicloFormativo) !== normalizeOption(ciclo)
      ) {
        return false;
      }
      if (!q) return true;
      const cicloText = a.preferencias?.cicloFormativo?.toLowerCase() ?? '';
      const familiaText = a.preferencias?.familiaProfesional?.toLowerCase() ?? '';
      return (
        a.displayName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        cicloText.includes(q) ||
        familiaText.includes(q)
      );
    }).sort(compareAlumnosByAssignmentState);
  });

  ngOnInit(): void {
    this.searchFilter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.searchValue.set(value ?? ''));
    this.estadoFilter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.estadoValue.set(value ?? 'TODOS'));
    this.familiaFilter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.familiaValue.set(value ?? 'TODAS'));
    this.cicloFilter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.cicloValue.set(value ?? 'TODOS'));

    this.load();
  }

  protected estadoLabel(estado: 'ACTIVA' | 'FINALIZADA'): string {
    return estado === 'ACTIVA' ? 'Activa' : 'Finalizada';
  }

  protected modalidadLabel(value: string | null | undefined): string {
    if (!value) return 'Sin preferencia';
    return MODALIDAD_LABELS[value] ?? value;
  }

  protected formatFecha(value: string | null | undefined): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  protected formatFechaInicio(value: string | null | undefined): string {
    if (!value) return '';
    const [y, m, d] = value.split('-').map(Number);
    if (!y || !m || !d) return value;
    return new Date(y, m - 1, d).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  protected formatImporte(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2,
    }).format(value);
  }

  protected progressFor(asig: { horasTotales?: number; fechaInicio?: string; horasDiariasEstimadas?: number }) {
    return calcFctProgress({
      horasTotales: asig.horasTotales ?? 0,
      fechaInicio: asig.fechaInicio ?? todayIso(),
      horasDiariasEstimadas: asig.horasDiariasEstimadas ?? 7,
    });
  }

  protected progressLabel(asig: { horasTotales?: number; fechaInicio?: string; horasDiariasEstimadas?: number }): string {
    const p = this.progressFor(asig);
    if (p.status === 'pendiente') {
      return 'Comienza el ' + this.formatFechaInicio(asig.fechaInicio ?? null);
    }
    if (p.status === 'completada') {
      return 'Horas estimadas completadas';
    }
    return `${p.horasCompletadas} / ${asig.horasTotales ?? 0} h estimadas`;
  }

  protected openAssignModal(alumno: TutorAlumno): void {
    if (!alumno.asignacionPendiente || alumno.asignacionActual) return;
    this.selectedAlumno.set(alumno);
    this.assignStatus.set('idle');
    this.assignError.set('');
    this.assignForm.reset({
      horasTotales: 400,
      fechaInicio: todayIso(),
      horasDiariasEstimadas: 7,
      remunerada: false,
      importeMensual: null,
      observacionesRetribucion: '',
      observaciones: '',
    });
  }

  protected openAlumnoDetail(alumno: TutorAlumno): void {
    this.selectedDetailAlumno.set(alumno);
    this.cvActionStatus.set('idle');
    this.cvActionError.set('');
    this.chatError.set('');
  }

  protected closeAlumnoDetail(): void {
    if (this.cvActionStatus() === 'loading') return;
    if (this.openingChatForAlumnoId() !== null) return;
    this.selectedDetailAlumno.set(null);
    this.cvActionStatus.set('idle');
    this.cvActionError.set('');
    this.chatError.set('');
  }

  protected openAlumnoChat(alumno: TutorAlumno): void {
    if (this.openingChatForAlumnoId() !== null) return;
    this.openingChatForAlumnoId.set(alumno.id);
    this.chatError.set('');

    this.mensajesService
      .crearConversacion({ contactoId: alumno.id })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (conversacion) => {
          this.openingChatForAlumnoId.set(null);
          this.mensajesCache.invalidate();
          this.selectedDetailAlumno.set(null);
          this.router.navigate(['/mensajes'], {
            queryParams: { conversacionId: conversacion.id },
          });
        },
        error: (err: unknown) => {
          this.openingChatForAlumnoId.set(null);
          this.chatError.set(this.describeChatError(err));
        },
      });
  }

  private describeChatError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 403) return 'No puedes iniciar un chat con este alumno.';
      if (err.status === 404) return 'El alumno ya no existe.';
      if (err.status === 0) return 'No se pudo contactar con el servidor.';
    }
    return 'No se pudo abrir el chat. Inténtalo de nuevo.';
  }

  protected openCreateAlumnoModal(): void {
    this.createAlumnoForm.reset({
      displayName: '',
      username: '',
      password: '',
      centroEmail: '',
    });
    this.isCreateAlumnoModalOpen.set(true);
    this.createAlumnoStatus.set('idle');
    this.createAlumnoError.set('');
  }

  protected closeCreateAlumnoModal(): void {
    if (this.createAlumnoStatus() === 'saving') return;
    this.isCreateAlumnoModalOpen.set(false);
    this.createAlumnoStatus.set('idle');
    this.createAlumnoError.set('');
  }

  protected submitCreateAlumno(): void {
    if (this.createAlumnoStatus() === 'saving') return;
    if (this.createAlumnoForm.invalid) {
      this.createAlumnoForm.markAllAsTouched();
      return;
    }

    const raw = this.createAlumnoForm.getRawValue();
    const centroLocal = raw.centroEmail.trim().toLowerCase();
    const request: TutorAlumnoCreateRequest = {
      displayName: raw.displayName.trim(),
      username: raw.username.trim(),
      password: raw.password,
      centroEmail: centroLocal.endsWith('@elpuig.xeill.net')
        ? centroLocal
        : `${centroLocal}@elpuig.xeill.net`,
    };

    this.createAlumnoStatus.set('saving');
    this.createAlumnoError.set('');
    this.tutorService
      .createAlumno(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (alumno) => {
          this.alumnos.update((current) => [...current, alumno]);
          this.createAlumnoStatus.set('success');
          this.isCreateAlumnoModalOpen.set(false);
          this.cache.invalidate();
          this.load(true);
        },
        error: (err: unknown) => {
          this.createAlumnoStatus.set('error');
          this.createAlumnoError.set(this.describeCreateAlumnoError(err));
        },
      });
  }

  protected downloadImportTemplate(): void {
    if (this.importStatus() === 'uploading') return;
    this.tutorService
      .downloadImportTemplate()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => this.downloadBlob(blob, 'plantilla-alumnos-fctnow.xlsx'),
        error: (err: unknown) => {
          this.importStatus.set('error');
          this.importError.set(this.describeImportError(err));
        },
      });
  }

  protected importExcel(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || this.importStatus() === 'uploading') return;

    this.importStatus.set('uploading');
    this.importError.set('');
    this.importResult.set(null);
    this.tutorService
      .importAlumnos(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.importResult.set(result);
          this.importStatus.set('success');
          input.value = '';
          this.cache.invalidate();
          this.load(true);
        },
        error: (err: unknown) => {
          this.importStatus.set('error');
          this.importError.set(this.describeImportError(err));
          input.value = '';
        },
      });
  }

  protected setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  protected clearFilters(): void {
    this.searchFilter.setValue('');
    this.estadoFilter.setValue('TODOS');
    this.familiaFilter.setValue('TODAS');
    this.cicloFilter.setValue('TODOS');
  }

  protected cvSummary(alumno: TutorAlumno): string {
    const size = alumno.cvSize ? `${Math.round(alumno.cvSize / 1024)} KB` : 'tamaño no disponible';
    return alumno.cvUpdatedAt ? `${size} · actualizado el ${this.formatFecha(alumno.cvUpdatedAt)}` : size;
  }

  protected previewCv(alumno: TutorAlumno): void {
    this.openCv(alumno, 'preview');
  }

  protected downloadCv(alumno: TutorAlumno): void {
    this.openCv(alumno, 'download');
  }

  protected openOferta(pendiente: { tipo: 'INTERNA' | 'EXTERNA'; ofertaId: number | null; urlAplicacion: string | null }): void {
    if (pendiente.tipo === 'INTERNA' && pendiente.ofertaId != null) {
      this.router.navigate(['/practicas', pendiente.ofertaId]);
      return;
    }
    if (pendiente.tipo === 'EXTERNA' && pendiente.urlAplicacion) {
      window.open(pendiente.urlAplicacion, '_blank', 'noopener');
    }
  }

  protected closeAssignModal(): void {
    if (this.assignStatus() === 'assigning') return;
    this.selectedAlumno.set(null);
    this.assignStatus.set('idle');
    this.assignError.set('');
  }

  protected confirmAssign(alumno: TutorAlumno): void {
    const pendiente = alumno.asignacionPendiente;
    if (!pendiente || alumno.asignacionActual || this.assignStatus() === 'assigning') {
      return;
    }
    if (this.assignForm.invalid) {
      this.assignForm.markAllAsTouched();
      return;
    }

    const raw = this.assignForm.getRawValue();
    const remunerada = !!raw.remunerada;
    const observacionesRetribucion = raw.observacionesRetribucion?.trim();
    const observaciones = raw.observaciones?.trim();
    const importe = remunerada && raw.importeMensual != null ? Number(raw.importeMensual) : null;

    this.assignStatus.set('assigning');
    this.assignError.set('');
    const commonPayload = {
      horasTotales: Number(raw.horasTotales),
      fechaInicio: raw.fechaInicio,
      horasDiariasEstimadas: Number(raw.horasDiariasEstimadas),
      remunerada,
      importeMensual: importe,
      observacionesRetribucion: remunerada && observacionesRetribucion ? observacionesRetribucion : undefined,
      observaciones: observaciones ? observaciones : undefined,
    };
    const request$: Observable<unknown> = pendiente.tipo === 'INTERNA'
      ? this.asignacionesService.create({ solicitudId: pendiente.solicitudId, ...commonPayload })
      : this.asignacionesExternasService.create({ solicitudExternaId: pendiente.solicitudId, ...commonPayload });

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.assignStatus.set('success');
          this.selectedAlumno.set(null);
          this.cache.invalidate();
          this.load(true);
        },
        error: (err: unknown) => {
          this.assignStatus.set('error');
          this.assignError.set(this.describeAssignError(err));
        },
      });
  }

  private load(forceRefresh = false): void {
    if (!forceRefresh) {
      const cached = this.cache.get();
      if (cached) {
        this.alumnos.set(cached);
        this.errorMessage.set('');
        this.status.set('loaded');
        this.consumePendingAssignParam();
        return;
      }
    }

    this.status.set('loading');
    this.errorMessage.set('');
    this.tutorService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.cache.set(data);
          this.alumnos.set(data);
          this.status.set('loaded');
          this.consumePendingAssignParam();
        },
        error: (err) => {
          this.status.set('error');
          this.errorMessage.set(this.describeError(err));
        },
      });
  }

  private consumePendingAssignParam(): void {
    const raw = this.activatedRoute.snapshot.queryParamMap.get('asignar');
    if (!raw) return;
    const id = Number(raw);
    if (!Number.isFinite(id)) return;

    const alumno = this.alumnos().find((a) => a.id === id);
    if (alumno && alumno.asignacionPendiente && !alumno.asignacionActual) {
      this.openAssignModal(alumno);
    }

    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { asignar: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private openCv(alumno: TutorAlumno, mode: 'preview' | 'download'): void {
    if (!alumno.hasCv || this.cvActionStatus() === 'loading') {
      return;
    }

    this.cvActionStatus.set('loading');
    this.cvActionError.set('');
    this.tutorService
      .downloadCv(alumno.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          if (mode === 'preview') {
            const opened = window.open(url, '_blank', 'noopener');
            if (!opened) {
              this.cvActionStatus.set('error');
              this.cvActionError.set('El navegador ha bloqueado la previsualización del CV.');
              URL.revokeObjectURL(url);
              return;
            }
          } else {
            const link = document.createElement('a');
            link.href = url;
            link.download = alumno.cvFileName || `cv-${alumno.id}.pdf`;
            link.click();
          }
          setTimeout(() => URL.revokeObjectURL(url), 30_000);
          this.cvActionStatus.set('idle');
        },
        error: (err: unknown) => {
          this.cvActionStatus.set('error');
          this.cvActionError.set(this.describeCvError(err));
        },
      });
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }

  private describeError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 401 || err.status === 403) {
        return 'Tu sesión no tiene permisos de tutor o coordinador.';
      }
      if (err.status === 0) {
        return 'No se pudo contactar con el servidor.';
      }
      return `Error ${err.status} al cargar datos.`;
    }
    if (err instanceof Error) {
      return err.message;
    }
    return 'Error desconocido al cargar datos.';
  }

  private describeCreateAlumnoError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 409) {
        return 'Ya existe una cuenta con ese email.';
      }
      if (err.status === 400) {
        return 'Revisa los datos obligatorios antes de crear la cuenta.';
      }
      if (err.status === 401 || err.status === 403) {
        return 'Tu sesion no tiene permisos para crear alumnos.';
      }
      if (err.status === 0) {
        return 'No se pudo contactar con el servidor.';
      }
      return `Error ${err.status} al crear el alumno.`;
    }
    if (err instanceof Error) {
      return err.message;
    }
    return 'Error desconocido al crear el alumno.';
  }

  private describeImportError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 400) {
        return 'No se pudo leer el Excel. Usa la plantilla descargada.';
      }
      if (err.status === 401 || err.status === 403) {
        return 'Tu sesion no tiene permisos para importar alumnos.';
      }
      if (err.status === 0) {
        return 'No se pudo contactar con el servidor.';
      }
      return `Error ${err.status} al importar alumnos.`;
    }
    if (err instanceof Error) {
      return err.message;
    }
    return 'Error desconocido al importar alumnos.';
  }

  private describeAssignError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 409) {
        return 'No se puede crear la asignación: el alumno ya tiene una asignación activa o la solicitud ya no está disponible.';
      }
      if (err.status === 401 || err.status === 403) {
        return 'Tu sesión no tiene permisos para crear asignaciones.';
      }
      if (err.status === 0) {
        return 'No se pudo contactar con el servidor.';
      }
      return `Error ${err.status} al crear la asignación.`;
    }
    if (err instanceof Error) {
      return err.message;
    }
    return 'Error desconocido al crear la asignación.';
  }

  private describeCvError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 404) {
        return 'El CV ya no está disponible.';
      }
      if (err.status === 401 || err.status === 403) {
        return 'Tu sesión no tiene permisos para consultar este CV.';
      }
      if (err.status === 0) {
        return 'No se pudo contactar con el servidor.';
      }
      return `Error ${err.status} al abrir el CV.`;
    }
    if (err instanceof Error) {
      return err.message;
    }
    return 'Error desconocido al abrir el CV.';
  }
}

const MODALIDAD_LABELS: Record<string, string> = {
  PRESENCIAL: 'Presencial',
  HIBRIDA: 'Híbrida',
  REMOTA: 'Remota',
};

function distinctSorted(values: Array<string | null | undefined>): string[] {
  const byNormalizedValue = new Map<string, string>();
  for (const value of values) {
    const label = value?.trim().replace(/\s+/g, ' ');
    if (!label) continue;
    const normalized = normalizeOption(label);
    if (!byNormalizedValue.has(normalized)) {
      byNormalizedValue.set(normalized, label);
    }
  }
  return Array.from(byNormalizedValue.values()).sort((a, b) =>
    a.localeCompare(b, 'es', { sensitivity: 'base' }),
  );
}

function normalizeOption(value: string | null | undefined): string {
  return (
    value
      ?.trim()
      .replace(/\s+/g, ' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('es') ?? ''
  );
}

function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function compareAlumnosByAssignmentState(a: TutorAlumno, b: TutorAlumno): number {
  const aReady = !!a.asignacionPendiente && !a.asignacionActual;
  const bReady = !!b.asignacionPendiente && !b.asignacionActual;
  if (aReady !== bReady) return aReady ? -1 : 1;

  const stateDiff = Number(!!a.asignacionActual) - Number(!!b.asignacionActual);
  if (stateDiff !== 0) return stateDiff;

  return a.displayName.localeCompare(b.displayName, 'es', { sensitivity: 'base' });
}
