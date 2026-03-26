import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { usersApi } from '@/api/users';
import type { UserDto, CreateUserPayload, UpdateUserPayload } from '@/types/user.types';
import type { UserModules } from '@/types';

interface UsersState {
  list: UserDto[];
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  list: [],
  loading: false,
  error: null,
};

export const fetchUsers = createAsyncThunk('users/fetchAll', () => usersApi.list());

export const createUser = createAsyncThunk(
  'users/create',
  (payload: CreateUserPayload) => usersApi.create(payload),
);

export const updateUser = createAsyncThunk(
  'users/update',
  ({ id, payload }: { id: string; payload: UpdateUserPayload }) => usersApi.update(id, payload),
);

export const updateUserModules = createAsyncThunk(
  'users/updateModules',
  ({ id, modules }: { id: string; modules: UserModules }) => usersApi.updateModules(id, modules),
);

export const resetUserPassword = createAsyncThunk(
  'users/resetPassword',
  async ({ id, newPassword }: { id: string; newPassword: string }) => {
    await usersApi.resetPassword(id, newPassword);
  },
);

export const deleteUser = createAsyncThunk('users/delete', async (id: string) => {
  await usersApi.delete(id);
  return id;
});

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchUsers.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchUsers.rejected, (state, action) => { state.loading = false; state.error = action.error.message ?? 'Error'; })
      .addCase(createUser.fulfilled, (state, action) => { state.list.push(action.payload); })
      .addCase(updateUser.fulfilled, (state, action) => {
        const idx = state.list.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(updateUserModules.fulfilled, (state, action) => {
        const idx = state.list.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.list = state.list.filter((u) => u.id !== action.payload);
      });
  },
});

export default usersSlice.reducer;
