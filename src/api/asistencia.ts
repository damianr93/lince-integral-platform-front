import type { EmpleadoAsistencia, FichajeAsistencia, FichajesPage, Planta } from '@/types';
import { api } from './client';

export interface FichajesQuery {
  page?: number;
  limit?: number;
  planta?: Planta;
  empleadoId?: string;
  pin?: string;
  estado?: '' | '0' | '1';
}

export interface UpdateFichajePayload {
  estado?: 0 | 1;
  empleadoId?: string;
  tiempo?: string;
}

export interface CreateEmpleadoPayload {
  firstName: string;
  lastName: string;
  pin: string;
  planta: Planta;
  activo?: boolean;
}

export const asistenciaApi = {
  getFichajes: async (query: FichajesQuery) => {
    const qs = new URLSearchParams();
    if (query.page) qs.set('page', String(query.page));
    if (query.limit) qs.set('limit', String(query.limit));
    if (query.planta) qs.set('planta', query.planta);
    if (query.empleadoId) qs.set('empleadoId', query.empleadoId);
    if (query.pin) qs.set('pin', query.pin);
    if (query.estado !== undefined && query.estado !== '') qs.set('estado', query.estado);
    return api.get<FichajesPage>(`/asistencia/logs?${qs.toString()}`);
  },

  updateFichaje: (id: string, payload: UpdateFichajePayload) =>
    api.patch<FichajeAsistencia>(`/asistencia/logs/${id}`, payload),

  getEmpleados: (planta?: Planta) =>
    api.get<EmpleadoAsistencia[]>(
      planta ? `/asistencia/empleados?planta=${planta}&soloActivos=true` : '/asistencia/empleados?soloActivos=true',
    ),

  createEmpleado: (payload: CreateEmpleadoPayload) =>
    api.post<EmpleadoAsistencia>('/asistencia/empleados', payload),

  reconcileUnmatched: (limit = 2000) =>
    api.post<{ scanned: number; matched: number }>(`/asistencia/logs/reconcile-unmatched?limit=${limit}`, {}),
};
