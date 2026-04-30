export type Planta = 'tucuman' | 'villa_nueva';

export interface EmpleadoAsistencia {
  id: string;
  firstName: string;
  lastName: string;
  dni?: string | null;
  pin: string;
  planta: Planta;
  departamento?: string | null;
  cargo?: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FichajeAsistencia {
  id: string;
  empleadoId: string | null;
  pin: string;
  tiempo: string;
  estado: 0 | 1;
  verify: number | null;
  deviceSn: string | null;
  planta: Planta | null;
  rawPayload: string | null;
  createdAt: string;
  empleado: EmpleadoAsistencia | null;
}

export interface FichajesPage {
  items: FichajeAsistencia[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  fecha?: string;
}
