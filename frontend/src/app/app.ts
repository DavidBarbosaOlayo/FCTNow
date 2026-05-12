import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  ViewChild,
  inject,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppNavigation } from './layout/app-navigation';
import { RouteTransitionsService } from './layout/route-transitions.service';

@Component({
  selector: 'app-root',
  imports: [AppNavigation, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly transitions = inject(RouteTransitionsService);
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('routeHost', { static: true })
  private readonly routeHost?: ElementRef<HTMLElement>;

  protected onRouteActivated(): void {
    if (!isPlatformBrowser(this.platformId) || !this.routeHost) {
      return;
    }

    const direction = this.transitions.consumeDirection();
    if (direction === 'none') {
      return;
    }

    const element = this.routeHost.nativeElement;
    const className =
      direction === 'forward' ? 'is-sliding-forward' : 'is-sliding-backward';

    element.classList.remove('is-sliding-forward', 'is-sliding-backward');
    void element.offsetHeight;
    element.classList.add(className);

    const cleanup = () => {
      element.classList.remove(className);
      element.removeEventListener('animationend', cleanup);
      element.removeEventListener('animationcancel', cleanup);
    };
    element.addEventListener('animationend', cleanup);
    element.addEventListener('animationcancel', cleanup);
  }
}
