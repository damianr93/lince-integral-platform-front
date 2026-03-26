import { api, API_BASE_URL, getAccessToken } from './client';
import type { Customer, Satisfaction, FollowUpEvent, GeoResult } from '@/types/crm.types';

// --- Customers ---
export const getCustomers = () => api.get<Customer[]>('/crm/clients');

export const createCustomer = (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) =>
  api.post<Customer>('/crm/clients', data);

export const updateCustomer = (id: string, data: Partial<Customer>) =>
  api.patch<Customer>(`/crm/clients/${id}`, data);

export const deleteCustomer = (id: string) =>
  api.delete<void>(`/crm/clients/${id}`);

export async function exportCustomersExcel(): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/crm/clients/export/excel`, {
    headers: { Authorization: `Bearer ${getAccessToken() ?? ''}` },
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'clientes.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}

// --- Analytics ---
export const getAnalyticsTotales = (year: number) =>
  api.get<{
    totalContacts: number;
    totalReconsultas: number;
    firstTimeContacts: number;
    byChannel: { channel: string; total: number }[];
  }>(`/crm/analytics/totales?year=${year}`);

export const getAnalyticsEvolution = (year: number) =>
  api.get<{ date: string; total: number }[]>(`/crm/analytics/evolucion?year=${year}`);

export const getAnalyticsYearlyComparison = (years: number[]) =>
  api.get<Record<string, number | string>[]>(
    `/crm/analytics/yearly-comparison?years=${years.join(',')}`,
  );

export const getAnalyticsDemandOfProduct = (year: number) =>
  api.get<{ product: string; total: number }[]>(`/crm/analytics/demand-of-product?year=${year}`);

export const getAnalyticsStatus = (year: number) =>
  api.get<{ status: string; total: number; percentage: number }[]>(
    `/crm/analytics/status?year=${year}`,
  );

export const getFollowUpEvents = (params: { assignedTo?: string; status?: string }) => {
  const qs = new URLSearchParams();
  if (params.assignedTo) qs.set('assignedTo', params.assignedTo);
  if (params.status) qs.set('status', params.status);
  return api.get<FollowUpEvent[]>(`/crm/analytics/follow-up-events?${qs.toString()}`);
};

export const updateFollowUpEventStatus = (
  id: string,
  data: { status: 'COMPLETED' | 'CANCELLED' | 'READY'; notes?: string },
) => api.patch<FollowUpEvent>(`/crm/follow-up/events/${id}/status`, data);

// --- Satisfaction ---
export const getSatisfactions = () => api.get<Satisfaction[]>('/crm/satisfaction');

export const createSatisfaction = (data: Omit<Satisfaction, 'id' | 'createdAt'>) =>
  api.post<Satisfaction>('/crm/satisfaction', data);

export const updateSatisfaction = (id: string, data: Partial<Satisfaction>) =>
  api.patch<Satisfaction>(`/crm/satisfaction/${id}`, data);

export const deleteSatisfaction = (id: string) =>
  api.delete<void>(`/crm/satisfaction/${id}`);

// --- Geo ---
export const searchGeo = (q: string, limit = 6) =>
  api.get<GeoResult[]>(`/crm/geo/search?q=${encodeURIComponent(q)}&limit=${limit}`);

// --- PDF Report ---
export async function downloadLocationReportPdf(params: {
  startDate?: string;
  endDate?: string;
  provincias?: string;
  paises?: string;
  zonas?: string;
}): Promise<void> {
  const qs = new URLSearchParams();
  if (params.startDate) qs.set('startDate', params.startDate);
  if (params.endDate) qs.set('endDate', params.endDate);
  if (params.provincias) qs.set('provincias', params.provincias);
  if (params.paises) qs.set('paises', params.paises);
  if (params.zonas) qs.set('zonas', params.zonas);

  const res = await fetch(
    `${API_BASE_URL}/crm/analytics/location-report/pdf?${qs.toString()}`,
    { headers: { Authorization: `Bearer ${getAccessToken() ?? ''}` } },
  );
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'reporte-ubicaciones.pdf';
  a.click();
  URL.revokeObjectURL(url);
}
