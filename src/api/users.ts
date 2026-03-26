import { api } from './client';
import type { UserDto, CreateUserPayload, UpdateUserPayload } from '@/types/user.types';
import type { UserModules } from '@/types';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export const usersApi = {
  async list(): Promise<UserDto[]> {
    const res = await api.get<PaginatedResponse<UserDto>>('/users');
    return res.data;
  },

  get(id: string): Promise<UserDto> {
    return api.get<UserDto>(`/users/${id}`);
  },

  create(payload: CreateUserPayload): Promise<UserDto> {
    return api.post<UserDto>('/users', payload);
  },

  update(id: string, payload: UpdateUserPayload): Promise<UserDto> {
    return api.patch<UserDto>(`/users/${id}`, payload);
  },

  updateModules(id: string, modules: UserModules): Promise<UserDto> {
    return api.patch<UserDto>(`/users/${id}/modules`, { modules });
  },

  resetPassword(id: string, newPassword: string): Promise<void> {
    return api.patch<void>(`/users/${id}/reset-password`, { newPassword });
  },

  delete(id: string): Promise<void> {
    return api.delete<void>(`/users/${id}`);
  },
};
