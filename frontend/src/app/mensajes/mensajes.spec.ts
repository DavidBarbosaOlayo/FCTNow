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
        otroParticipantePhotoDataUrl: null,
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
        remitentePhotoDataUrl: null,
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

  it('groups consecutive messages from the same sender', () => {
    const fixture = TestBed.createComponent(MensajesPage);
    fixture.detectChanges();

    httpTesting.expectOne('/api/mensajes/conversaciones').flush([
      {
        id: 1,
        titulo: 'Empresa Demo',
        otroParticipanteId: 2,
        otroParticipanteNombre: 'Empresa Demo',
        otroParticipantePhotoDataUrl: null,
        ultimoMensaje: 'Segundo aviso',
        ultimoMensajeAt: '2026-05-11T10:02:00Z',
        ultimoMensajePropio: false,
        updatedAt: '2026-05-11T10:02:00Z',
      },
    ]);
    httpTesting.expectOne('/api/mensajes/conversaciones/1').flush([
      {
        id: 10,
        remitenteId: 2,
        remitenteNombre: 'Empresa Demo',
        remitentePhotoDataUrl: null,
        contenido: 'Primer aviso',
        propio: false,
        createdAt: '2026-05-11T10:00:00Z',
      },
      {
        id: 11,
        remitenteId: 2,
        remitenteNombre: 'Empresa Demo',
        remitentePhotoDataUrl: null,
        contenido: 'Segundo aviso',
        propio: false,
        createdAt: '2026-05-11T10:02:00Z',
      },
    ]);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.message-row') as NodeListOf<HTMLElement>;
    expect(rows.length).toBe(2);
    expect(rows[0].querySelector('.message-avatar')).not.toBeNull();
    expect(rows[0].querySelector('.message-meta')?.textContent).toContain('Empresa Demo');
    expect(rows[1].classList).toContain('is-grouped');
    expect(rows[1].querySelector('.message-avatar')).toBeNull();
    expect(rows[1].querySelector('.message-meta')).toBeNull();
    expect(rows[1].querySelector('.message-time-only')?.textContent?.trim()).toBe('12:02');
  });

  it('scrolls the thread to the bottom when requested', () => {
    const fixture = TestBed.createComponent(MensajesPage);
    const scrollTo = jasmine.createSpy('scrollTo');

    (fixture.componentInstance as unknown as { threadBody: { nativeElement: unknown } }).threadBody = {
      nativeElement: {
        scrollHeight: 320,
        scrollTo,
      },
    };
    (fixture.componentInstance as unknown as { messageStatus: { set(value: 'idle'): void } }).messageStatus.set(
      'idle',
    );

    (fixture.componentInstance as unknown as { scrollThreadToBottom(): void }).scrollThreadToBottom();

    expect(scrollTo).toHaveBeenCalledWith({ top: 320, behavior: 'auto' });
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
        otroParticipantePhotoDataUrl: null,
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
      remitentePhotoDataUrl: null,
      contenido: 'Gracias por avisar',
      propio: true,
      createdAt: '2026-05-11T10:05:00Z',
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Gracias por avisar');
  });

  it('marks the send button as unavailable until the user types a message', () => {
    const fixture = TestBed.createComponent(MensajesPage);
    fixture.detectChanges();

    httpTesting.expectOne('/api/mensajes/conversaciones').flush([
      {
        id: 1,
        titulo: 'Empresa Demo',
        otroParticipanteId: 2,
        otroParticipanteNombre: 'Empresa Demo',
        otroParticipantePhotoDataUrl: null,
        ultimoMensaje: null,
        ultimoMensajeAt: null,
        ultimoMensajePropio: null,
        updatedAt: '2026-05-11T10:00:00Z',
      },
    ]);
    httpTesting.expectOne('/api/mensajes/conversaciones/1').flush([]);
    fixture.detectChanges();

    const sendButton = fixture.nativeElement.querySelector('.composer button') as HTMLButtonElement;
    expect(sendButton.getAttribute('aria-disabled')).toBe('true');
    expect(sendButton.classList).toContain('is-disabled');

    const textarea = fixture.nativeElement.querySelector('#mensaje-contenido') as HTMLTextAreaElement;
    textarea.value = 'Hola';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(sendButton.getAttribute('aria-disabled')).toBe('false');
    expect(sendButton.classList).not.toContain('is-disabled');
  });

  it('shows the empty message warning only after trying to send an empty message', () => {
    const fixture = TestBed.createComponent(MensajesPage);
    fixture.detectChanges();

    httpTesting.expectOne('/api/mensajes/conversaciones').flush([
      {
        id: 1,
        titulo: 'Empresa Demo',
        otroParticipanteId: 2,
        otroParticipanteNombre: 'Empresa Demo',
        otroParticipantePhotoDataUrl: null,
        ultimoMensaje: null,
        ultimoMensajeAt: null,
        ultimoMensajePropio: null,
        updatedAt: '2026-05-11T10:00:00Z',
      },
    ]);
    httpTesting.expectOne('/api/mensajes/conversaciones/1').flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Escribe un mensaje antes de enviarlo.');

    const sendButton = fixture.nativeElement.querySelector('.composer button') as HTMLButtonElement;
    sendButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Escribe un mensaje antes de enviarlo.');
    httpTesting.expectNone('/api/mensajes/conversaciones/1/mensajes');

    const textarea = fixture.nativeElement.querySelector('#mensaje-contenido') as HTMLTextAreaElement;
    textarea.value = 'Hola';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Escribe un mensaje antes de enviarlo.');
  });

  it('shows the empty message warning when pressing Enter without text', () => {
    const fixture = TestBed.createComponent(MensajesPage);
    fixture.detectChanges();

    httpTesting.expectOne('/api/mensajes/conversaciones').flush([
      {
        id: 1,
        titulo: 'Empresa Demo',
        otroParticipanteId: 2,
        otroParticipanteNombre: 'Empresa Demo',
        otroParticipantePhotoDataUrl: null,
        ultimoMensaje: null,
        ultimoMensajeAt: null,
        ultimoMensajePropio: null,
        updatedAt: '2026-05-11T10:00:00Z',
      },
    ]);
    httpTesting.expectOne('/api/mensajes/conversaciones/1').flush([]);
    fixture.detectChanges();

    const textarea = fixture.nativeElement.querySelector('#mensaje-contenido') as HTMLTextAreaElement;
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Escribe un mensaje antes de enviarlo.');
    httpTesting.expectNone('/api/mensajes/conversaciones/1/mensajes');
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
        otroParticipantePhotoDataUrl: null,
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
    expect(sendButton.getAttribute('aria-disabled')).toBe('false');

    sendButton.click();

    const request = httpTesting.expectOne('/api/mensajes/conversaciones/1/mensajes');
    expect(request.request.body).toEqual({ contenido: 'Mensaje desde click' });
    request.flush({
      id: 12,
      remitenteId: 1,
      remitenteNombre: 'Alumno Demo',
      remitentePhotoDataUrl: null,
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
        photoDataUrl: 'data:image/png;base64,aW1n',
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
      otroParticipantePhotoDataUrl: 'data:image/png;base64,aW1n',
      ultimoMensaje: null,
      ultimoMensajeAt: null,
      ultimoMensajePropio: null,
      updatedAt: '2026-05-11T10:10:00Z',
    });
    httpTesting.expectOne('/api/mensajes/conversaciones/8').flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Escribe el primer mensaje para iniciar una conversacion con Ana Compatible.',
    );
  });

  it('shows the participant photo when the conversation includes one', () => {
    const fixture = TestBed.createComponent(MensajesPage);
    fixture.detectChanges();

    httpTesting.expectOne('/api/mensajes/conversaciones').flush([
      {
        id: 1,
        titulo: 'Ana Compatible',
        otroParticipanteId: 4,
        otroParticipanteNombre: 'Ana Compatible',
        otroParticipantePhotoDataUrl: 'data:image/png;base64,aW1n',
        ultimoMensaje: 'Hola',
        ultimoMensajeAt: '2026-05-11T10:00:00Z',
        ultimoMensajePropio: false,
        updatedAt: '2026-05-11T10:00:00Z',
      },
    ]);
    httpTesting.expectOne('/api/mensajes/conversaciones/1').flush([
      {
        id: 10,
        remitenteId: 4,
        remitenteNombre: 'Ana Compatible',
        remitentePhotoDataUrl: 'data:image/png;base64,aW1n',
        contenido: 'Hola',
        propio: false,
        createdAt: '2026-05-11T10:00:00Z',
      },
    ]);
    fixture.detectChanges();

    const images = Array.from(fixture.nativeElement.querySelectorAll('img')) as HTMLImageElement[];
    expect(images.some((image) => image.src.includes('data:image/png;base64,aW1n'))).toBeTrue();
  });
});
