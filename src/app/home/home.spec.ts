import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Home } from './home';

describe('Home', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('should render the FCTNow preview heading', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('Una portada con cara y ojos');
    expect(compiled.textContent).toContain('FCTNow');
  });
});
