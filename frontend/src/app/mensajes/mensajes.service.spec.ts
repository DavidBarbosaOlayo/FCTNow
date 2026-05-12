import { provideZonelessChangeDetection, signal } from '@angular/core';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthenticatedUser } from '../auth/auth.models';
import { AuthService } from '../auth/auth.service';
import { MensajesService } from './mensajes.service';

describe('MensajesService', () => {
  let service: MensajesService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            accessToken: () => 'token-demo',
            currentUser: signal<AuthenticatedUser | null>({
              id: 1,
              email: 'alumno@example.com',
              displayName: 'Alumno Demo',
              roles: ['ALUMNO'],
            } as AuthenticatedUser),
          },
        },
      ],
    });

    service = TestBed.inject(MensajesService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('lists authenticated conversations', () => {
    service.listConversaciones().subscribe((items) => {
      expect(items.length).toBe(1);
      expect(items[0].titulo).toBe('Empresa Demo');
    });

    const request = httpTesting.expectOne('/api/mensajes/conversaciones');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token-demo');
    request.flush([
      {
        id: 1,
        titulo: 'Empresa Demo',
        otroParticipanteId: 2,
        otroParticipanteNombre: 'Empresa Demo',
        ultimoMensaje: 'Hola',
        ultimoMensajeAt: '2026-05-11T10:00:00Z',
        ultimoMensajePropio: false,
        updatedAt: '2026-05-11T10:00:00Z',
      },
    ]);
  });

  it('sends trimmed messages to an existing conversation', () => {
    service.enviarMensaje(3, { contenido: '  Gracias  ' }).subscribe((message) => {
      expect(message.contenido).toBe('Gracias');
      expect(message.propio).toBeTrue();
    });

    const request = httpTesting.expectOne('/api/mensajes/conversaciones/3/mensajes');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ contenido: 'Gracias' });
    request.flush({
      id: 9,
      remitenteId: 1,
      remitenteNombre: 'Alumno Demo',
      contenido: 'Gracias',
      propio: true,
      createdAt: '2026-05-11T10:05:00Z',
    });
  });

  it('searches compatible contacts by name', () => {
    service.buscarContactos(' ana ').subscribe((items) => {
      expect(items.length).toBe(1);
      expect(items[0].displayName).toBe('Ana Compatible');
    });

    const request = httpTesting.expectOne((candidate) =>
      candidate.url === '/api/mensajes/contactos' && candidate.params.get('nombre') === 'ana',
    );
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 4,
        displayName: 'Ana Compatible',
        familiaProfesional: 'Informatica y comunicaciones',
        cicloFormativo: 'Desarrollo de Aplicaciones Web',
      },
    ]);
  });

  it('creates a conversation with a selected contact', () => {
    service.crearConversacion({ contactoId: 4 }).subscribe((conversation) => {
      expect(conversation.id).toBe(8);
      expect(conversation.titulo).toBe('Ana Compatible');
    });

    const request = httpTesting.expectOne('/api/mensajes/conversaciones');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ contactoId: 4 });
    request.flush({
      id: 8,
      titulo: 'Ana Compatible',
      otroParticipanteId: 4,
      otroParticipanteNombre: 'Ana Compatible',
      ultimoMensaje: null,
      ultimoMensajeAt: null,
      ultimoMensajePropio: null,
      updatedAt: '2026-05-11T10:10:00Z',
    });
  });

  it('tracks unread conversations until they are marked as seen', () => {
    service.listConversaciones().subscribe();

    httpTesting.expectOne('/api/mensajes/conversaciones').flush([
      {
        id: 1,
        titulo: 'Tutor Demo',
        otroParticipanteId: 3,
        otroParticipanteNombre: 'Tutor Demo',
        ultimoMensaje: 'Nuevo mensaje',
        ultimoMensajeAt: '2026-05-11T10:00:00Z',
        ultimoMensajePropio: false,
        updatedAt: '2026-05-11T10:00:00Z',
      },
    ]);

    expect(service.unreadCount()).toBe(1);

    service.markConversationSeen(1, '2026-05-11T10:00:00Z');

    expect(service.unreadCount()).toBe(0);
  });
});
