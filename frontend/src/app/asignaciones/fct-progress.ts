export type FctProgressInput = {
  horasTotales: number;
  fechaInicio: string;
  horasDiariasEstimadas: number;
};

export type FctProgress = {
  percent: number;
  horasCompletadas: number;
  status: 'pendiente' | 'en-curso' | 'completada';
  inicio: Date;
  hoy: Date;
};

export function calcFctProgress(input: FctProgressInput, now: Date = new Date()): FctProgress {
  const inicio = parseFechaInicio(input.fechaInicio);
  const hoy = stripTime(now);
  const inicioDay = stripTime(inicio);

  if (hoy < inicioDay) {
    return {
      percent: 0,
      horasCompletadas: 0,
      status: 'pendiente',
      inicio: inicioDay,
      hoy,
    };
  }

  const businessDays = countBusinessDays(inicioDay, hoy);
  const horasCompletadas = businessDays * input.horasDiariasEstimadas;
  const raw = input.horasTotales > 0
    ? (horasCompletadas / input.horasTotales) * 100
    : 0;
  const percent = Math.max(0, Math.min(100, Math.round(raw)));
  return {
    percent,
    horasCompletadas: Math.min(horasCompletadas, input.horasTotales),
    status: percent >= 100 ? 'completada' : 'en-curso',
    inicio: inicioDay,
    hoy,
  };
}

function parseFechaInicio(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function stripTime(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function countBusinessDays(from: Date, to: Date): number {
  if (to < from) return 0;
  let total = 0;
  const cursor = new Date(from);
  while (cursor <= to) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) total += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return Math.max(0, total - 1);
}
