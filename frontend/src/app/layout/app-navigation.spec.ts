import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppNavigation } from './app-navigation';

describe('AppNavigation', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppNavigation],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();
  });

  it('should render the main route links', () => {
    const fixture = TestBed.createComponent(AppNavigation);
    fixture.detectChanges();
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')) as HTMLAnchorElement[];
    const labels = links.map((link) => link.textContent?.trim());
    const hrefs = links.map((link) => link.getAttribute('href'));

    expect(labels).toEqual([
      'FCTNow',
      'Inicio',
      'Prácticas',
      'Mensajes',
      'Notificaciones',
      'Perfil',
    ]);
    expect(hrefs).toEqual([
      '/',
      '/',
      '/practicas',
      '/mensajes',
      '/notificaciones',
      '/perfil',
    ]);
  });
});
