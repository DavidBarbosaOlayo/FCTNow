import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { AuthenticatedUser } from '../auth/auth.models';
import { StudentHomeFeed } from './home.models';
import { Home } from './home';
import { HomeService } from './home.service';

describe('Home', () => {
  let homeService: jasmine.SpyObj<HomeService>;

  async function configure(user: AuthenticatedUser | null, feed: StudentHomeFeed = sampleFeed) {
    homeService = jasmine.createSpyObj<HomeService>('HomeService', ['getStudentFeed']);
    homeService.getStudentFeed.and.returnValue(of(feed));

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: HomeService, useValue: homeService },
        {
          provide: AuthService,
          useValue: {
            currentUser: signal(user),
          },
        },
      ],
    }).compileComponents();
  }

  it('should render recommended offers, peer activity and announcements for students', async () => {
    await configure({
      id: 1,
      email: 'ana@example.com',
      displayName: 'Ana Ruiz',
      roles: ['ALUMNO'],
    });

    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(homeService.getStudentFeed).toHaveBeenCalledTimes(1);
    expect(compiled.querySelector('header.home-header')).toBeNull();
    expect(compiled.textContent).toContain('Top 5 para ti');
    expect(compiled.textContent).toContain('Beca desarrollo frontend');
    expect(compiled.textContent).toContain('2 solicitudes aceptadas esta semana');
    expect(compiled.textContent).toContain('Entrega de documentación inicial');
    expect(compiled.querySelectorAll('.offer-card').length).toBe(5);
  });

  it('should show a clear CTA when student preferences are incomplete', async () => {
    await configure(
      {
        id: 1,
        email: 'ana@example.com',
        displayName: 'Ana Ruiz',
        roles: ['ALUMNO'],
      },
      {
        ...sampleFeed,
        student: {
          ...sampleFeed.student,
          preferenciasCompletas: false,
        },
      },
    );

    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Mejora tus recomendaciones');
    expect(compiled.querySelector<HTMLAnchorElement>('.preference-callout .primary-action')?.href).toContain(
      '/perfil',
    );
  });

  it('should not request student feed for non alumno roles', async () => {
    await configure({
      id: 2,
      email: 'empresa@example.com',
      displayName: 'Empresa Demo',
      roles: ['EMPRESA'],
    });

    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(homeService.getStudentFeed).not.toHaveBeenCalled();
    expect(compiled.textContent).toContain('Este inicio está orientado al alumnado');
    expect(compiled.textContent).not.toContain('2 solicitudes aceptadas');
  });

  it('should render an actionable error state when the feed fails', async () => {
    await configure({
      id: 1,
      email: 'ana@example.com',
      displayName: 'Ana Ruiz',
      roles: ['ALUMNO'],
    });
    homeService.getStudentFeed.and.returnValue(throwError(() => new Error('Network error')));

    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('No pudimos cargar Inicio');
    expect(compiled.querySelector('button.primary-action')?.textContent).toContain('Reintentar');
  });
});

const sampleFeed: StudentHomeFeed = {
  student: {
    displayName: 'Ana Ruiz',
    familiaProfesional: 'Informática y comunicaciones',
    cicloFormativo: 'Desarrollo de Aplicaciones Web',
    localidadPreferida: 'Valencia',
    modalidadPreferida: 'HIBRIDA',
    preferenciasCompletas: true,
  },
  recommendedOffers: [
    {
      id: 'external-1',
      source: 'EXTERNA',
      offerId: null,
      externalUrl: 'https://example.com/oferta-1',
      title: 'Beca desarrollo frontend',
      company: 'Studio Norte',
      location: 'Valencia',
      modality: null,
      publishedAt: '2026-05-04T12:00:00Z',
      statusLabel: 'Solicitar en Adzuna',
      matchReasons: ['Familia profesional', 'Ciclo formativo', 'Localidad preferida'],
    },
    {
      id: 'external-2',
      source: 'EXTERNA',
      offerId: null,
      externalUrl: 'https://example.com/oferta-2',
      title: 'Prácticas QA web',
      company: 'Levante Digital',
      location: 'Valencia',
      modality: null,
      publishedAt: '2026-05-04T12:00:00Z',
      statusLabel: 'Solicitar en Adzuna',
      matchReasons: ['Familia profesional', 'Localidad preferida'],
    },
    {
      id: 'external-3',
      source: 'EXTERNA',
      offerId: null,
      externalUrl: 'https://example.com/oferta-3',
      title: 'Beca soporte técnico',
      company: 'Cloud Ops',
      location: 'Paterna, Valencia',
      modality: null,
      publishedAt: '2026-05-04T12:00:00Z',
      statusLabel: 'Solicitar en Adzuna',
      matchReasons: ['Familia profesional'],
    },
    {
      id: 'external-4',
      source: 'EXTERNA',
      offerId: null,
      externalUrl: 'https://example.com/oferta-4',
      title: 'Prácticas analista junior',
      company: 'Data Harbor',
      location: 'Burjassot, Valencia',
      modality: null,
      publishedAt: '2026-05-04T12:00:00Z',
      statusLabel: 'Solicitar en Adzuna',
      matchReasons: ['Ciclo formativo'],
    },
    {
      id: 'external-5',
      source: 'EXTERNA',
      offerId: null,
      externalUrl: 'https://example.com/oferta-5',
      title: 'Beca automatización',
      company: 'Deploy Labs',
      location: 'Valencia',
      modality: null,
      publishedAt: '2026-05-04T12:00:00Z',
      statusLabel: 'Solicitar en Adzuna',
      matchReasons: ['Familia profesional', 'Localidad preferida'],
    },
  ],
  peerActivity: [
    {
      id: 'activity-1',
      title: 'Empresas con respuesta positiva',
      summary: 'Varias ofertas de desarrollo web han avanzado a fase de entrevista.',
      metric: '2 solicitudes aceptadas esta semana',
      company: 'Tech Norte Formación',
      studentName: 'Lucía García',
      studentPhotoUrl: null,
      occurredAt: '2026-05-08T09:00:00Z',
      actionUrl: '/practicas',
    },
  ],
  announcements: [
    {
      id: 'announcement-1',
      kind: 'NOTIFICATION',
      title: 'Entrega de documentación inicial',
      body: 'Revisa tu CV y confirma disponibilidad antes del viernes.',
      authorName: 'Laura Martín',
      authorRole: 'TUTOR_CENTRO',
      publishedAt: '2026-05-06T09:00:00Z',
      actionLabel: 'Ver perfil',
      actionUrl: '/perfil',
    },
  ],
};
