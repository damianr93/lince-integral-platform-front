import { api } from './client';
import type { AreaDto, CreateAreaPayload, UpdateAreaPayload } from '@/types/user.types';

export const areasApi = {
  list(): Promise<AreaDto[]> {
    return api.get<AreaDto[]>('/areas');
  },

  create(payload: CreateAreaPayload): Promise<AreaDto> {
    return api.post<AreaDto>('/areas', payload);
  },

  update(id: string, payload: UpdateAreaPayload): Promise<AreaDto> {
    return api.patch<AreaDto>(`/areas/${id}`, payload);
  },

  delete(id: string): Promise<void> {
    return api.delete<void>(`/areas/${id}`);
  },
};
