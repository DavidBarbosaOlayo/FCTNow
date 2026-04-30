import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

type Highlight = {
  label: string;
  value: string;
};

type BoardCard = {
  state: string;
  title: string;
  detail: string;
};

type WorkflowStep = {
  phase: string;
  title: string;
  description: string;
};

type Workstream = {
  title: string;
  description: string;
  tag: string;
};

type Actor = {
  name: string;
  description: string;
};

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  protected readonly title = signal('FCTNow');

  protected readonly highlights: Highlight[] = [
    { label: 'Base', value: 'Angular 20 + SSR' },
    { label: 'Enfoque', value: 'Centro, empresa y alumnado' },
    { label: 'Estado', value: 'Frontpage operativa' },
  ];

  protected readonly boardCards: BoardCard[] = [
    {
      state: 'Preparado',
      title: 'Empresas y ofertas',
      detail:
        'Registro de empresas colaboradoras, catálogo de plazas y publicación de oportunidades FCT.',
    },
    {
      state: 'Escalable',
      title: 'Solicitudes y asignación',
      detail:
        'Preferencias del alumnado, revisión por tutores y un flujo claro para decidir asignaciones.',
    },
    {
      state: 'Trazable',
      title: 'Seguimiento y tutoría',
      detail:
        'Visitas, incidencias, hitos y observaciones reunidos en un único espacio operativo.',
    },
    {
      state: 'Ordenado',
      title: 'Evaluación y cierre',
      detail:
        'Documentación final, evaluación conjunta y reporting del ciclo sin depender de hojas dispersas.',
    },
  ];

  protected readonly workflowSteps: WorkflowStep[] = [
    {
      phase: '01',
      title: 'Preparación',
      description:
        'Perfiles, requisitos y empresas quedan listos antes de abrir el ciclo de solicitudes.',
    },
    {
      phase: '02',
      title: 'Asignación',
      description:
        'Preferencias, vacantes y criterios del centro convergen en un proceso entendible y visible.',
    },
    {
      phase: '03',
      title: 'Seguimiento',
      description:
        'Tutor centro, empresa y alumnado comparten estado, incidencias y evolución de la estancia.',
    },
    {
      phase: '04',
      title: 'Cierre',
      description:
        'La evaluación final y la documentación del ciclo quedan preparadas para consulta y trazabilidad.',
    },
  ];

  protected readonly workstreams: Workstream[] = [
    {
      tag: 'Producto',
      title: 'Arquitectura lista para crecer por módulos',
      description:
        'La portada ya separa la conversación entre empresas, alumnado, seguimiento y cierre, evitando una home genérica.',
    },
    {
      tag: 'Operativa',
      title: 'Jerarquía clara para revisar el estado del sistema',
      description:
        'La landing comunica de un vistazo qué partes del flujo FCT deben vivir aquí y cómo se conectan entre sí.',
    },
    {
      tag: 'UX',
      title: 'Composición visual pensada para escritorio y móvil',
      description:
        'Se mantiene una lectura cómoda en responsive y una identidad propia, lejos del scaffold inicial de Angular.',
    },
  ];

  protected readonly actors: Actor[] = [
    {
      name: 'Alumno',
      description: 'Consulta oportunidades, expresa preferencias y sigue el estado de su proceso FCT.',
    },
    {
      name: 'Empresa',
      description: 'Publica ofertas, colabora en el seguimiento y participa en la evaluación de la estancia.',
    },
    {
      name: 'Tutor centro',
      description: 'Supervisa el progreso, valida hitos y mantiene trazabilidad de cada práctica.',
    },
    {
      name: 'Coordinador',
      description: 'Gestiona el ciclo completo, detecta bloqueos y mantiene la visión operativa del programa.',
    },
  ];

  protected readonly checks: string[] = [
    'El arranque muestra una portada de producto real y no una pantalla provisional.',
    'La interfaz comunica el dominio FCTNow sin asumir todavía backend operativo.',
    'El renderizado sigue siendo compatible con SSR y deja una base limpia para iterar.',
  ];
}
