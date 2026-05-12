import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthenticatedUser } from '../auth/auth.models';
import { AuthService } from '../auth/auth.service';
import { MensajesPage } from './mensajes';

describe('MensajesPage', () => {
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MensajesPage],
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
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('renders conversations and opens the first thread', () => {
    const fixture = TestBed.createComponent(MensajesPage);
    fixture.detectChanges();

    httpTesting.expectOne('/api/mensajes/conversaciones').flush([
      {
        id: 1,
        titulo: 'Empresa Demo',
        otroParticipanteId: 2,
        otroParticipanteNombre: 'Empresa Demo',
        ultimoMensaje: 'Hola, revisamos tu solicitud.',
        ultimoMensajeAt: '2026-05-11T10:00:00Z',
        ultimoMensajePropio: false,
        updatedAt: '2026-05-11T10:00:00Z',
      },
    ]);
    httpTesting.expectOne('/api/mensajes/conversaciones/1').flush([
      {
        id: 10,
        remitenteId: 2,
        remitenteNombre: 'Empresa Demo',
        contenido: 'Hola, revisamos tu solicitud.',
        propio: false,
        createdAt: '2026-05-11T10:00:00Z',
      },
    ]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Empresa Demo');
    expect(compiled.textContent).toContain('Hola, revisamos tu solicitud.');
  });

  it('sends a non-empty reply and appends it to the thread', () => {
    const fixture = TestBed.createComponent(MensajesPage);
    fixture.detectChanges();

    httpTesting.expectOne('/api/mensajes/conversaciones').flush([
      {
        id: 1,
        titulo: 'Empresa Demo',
        otroParticipanteId: 2,
        otroParticipanteNombre: 'Empresa Demo',
        ultimoMensaje: null,
        ultimoMensajeAt: null,
        ultimoMensajePropio: null,
        updatedAt: '2026-05-11T10:00:00Z',
      },
    ]);
    httpTesting.expectOne('/api/mensajes/conversaciones/1').flush([]);
    fixture.detectChanges();

    (fixture.componentInstance as unknown as { messageControl: { setValue(value: string): void } })
      .messageControl
      .setValue('Gracias por avisar');
    fixture.detectChanges();

    (fixture.componentInstance as unknown as { sendMessage(): void }).sendMessage();

    const request = httpTesting.expectOne('/api/mensajes/conversaciones/1/mensajes');
    expect(request.request.body).toEqual({ contenido: 'Gracias por avisar' });
    request.flush({
      id: 11,
      remitenteId: 1,
      remitenteNombre: 'Alumno Demo',
      contenido: 'Gracias por avisar',
      propio: true,
      createdAt: '2026-05-11T10:05:00Z',
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Gracias por avisar');
  });

  it('enables the send button when the user types a message', () => {
    const fixture = TestBed.createComponent(MensajesPage);
    fixture.detectChanges();

    httpTesting.expectOne('/api/mensajes/conversaciones').flush([
      {
        id: 1,
        titulo: 'Empresa Demo',
        otroParticipanteId: 2,
        otroParticipanteNombre: 'Empresa Demo',
        ultimoMensaje: null,
        ultimoMensajeAt: null,
        ultimoMensajePropio: null,
        updatedAt: '2026-05-11T10:00:00Z',
      },
    ]);
    httpTesting.expectOne('/api/mensajes/conversaciones/1').flush([]);
    fixture.detectChanges();

    const sendButton = fixture.nativeElement.querySelector('.composer button') as HTMLButtonElement;
    expect(sendButton.disabled).toBeTrue();

    const textarea = fixture.nativeElement.querySelector('#mensaje-contenido') as HTMLTextAreaElement;
    textarea.value = 'Hola';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(sendButton.disabled).toBeFalse();
  });

  it('sends the message when clicking the enabled submit button', () => {
    const fixture = TestBed.createComponent(MensajesPage);
    fixture.detectChanges();

    httpTesting.expectOne('/api/mensajes/conversaciones').flush([
      {
        id: 1,
        titulo: 'Empresa Demo',
        otroParticipanteId: 2,
        otroParticipanteNombre: 'Empresa Demo',
        ultimoMensaje: null,
        ultimoMensajeAt: null,
        ultimoMensajePropio: null,
        updatedAt: '2026-05-11T10:00:00Z',
      },
    ]);
    httpTesting.expectOne('/api/mensajes/conversaciones/1').flush([]);
    fixture.detectChanges();

    const textarea = fixture.nativeElement.querySelector('#mensaje-contenido') as HTMLTextAreaElement;
    textarea.value = 'Mensaje desde click';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const sendButton = fixture.nativeElement.querySelector('.composer button') as HTMLButtonElement;
    expect(sendButton.disabled).toBeFalse();

    sendButton.click();

    const request = httpTesting.expectOne('/api/mensajes/conversaciones/1/mensajes');
    expect(request.request.body).toEqual({ contenido: 'Mensaje desde click' });
    request.flush({
      id: 12,
      remitenteId: 1,
      remitenteNombre: 'Alumno Demo',
      contenido: 'Mensaje desde click',
      propio: true,
      createdAt: '2026-05-11T10:06:00Z',
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Mensaje desde click');
  });

  it('opens contact search and starts a new conversation', () => {
    const fixture = TestBed.createComponent(MensajesPage);
    fixture.detectChanges();

    httpTesting.expectOne('/api/mensajes/conversaciones').flush([]);
    fixture.detectChanges();

    const newChatButton = fixture.nativeElement.querySelector('.new-chat-button') as HTMLButtonElement;
    newChatButton.click();
    fixture.detectChanges();

    httpTesting.expectOne('/api/mensajes/contactos').flush([
      {
        id: 4,
        displayName: 'Ana Compatible',
        familiaProfesional: 'Informatica y comunicaciones',
        cicloFormativo: 'Desarrollo de Aplicaciones Web',
      },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ana Compatible');

    const contactButton = fixture.nativeElement.querySelector('.contact-button') as HTMLButtonElement;
    contactButton.click();

    httpTesting.expectOne('/api/mensajes/conversaciones').flush({
      id: 8,
      titulo: 'Ana Compatible',
      otroParticipanteId: 4,
      otroParticipanteNombre: 'Ana Compatible',
      ultimoMensaje: null,
      ultimoMensajeAt: null,
      ultimoMensajePropio: null,
      updatedAt: '2026-05-11T10:10:00Z',
    });
    httpTesting.expectOne('/api/mensajes/conversaciones/8').flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Empieza la conversacion');
  });
});
