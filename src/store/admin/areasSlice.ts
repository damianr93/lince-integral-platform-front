import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { areasApi } from '@/api/areas';
import type { AreaDto, CreateAreaPayload, UpdateAreaPayload } from '@/types/user.types';

interface AreasState {
  list: AreaDto[];
  loading: boolean;
  error: string | null;
}

const initialState: AreasState = {
  list: [],
  loading: false,
  error: null,
};

export const fetchAreas = createAsyncThunk('areas/fetchAll', () => areasApi.list());

export const createArea = createAsyncThunk(
  'areas/create',
  (payload: CreateAreaPayload) => areasApi.create(payload),
);

export const updateArea = createAsyncThunk(
  'areas/update',
  ({ id, payload }: { id: string; payload: UpdateAreaPayload }) => areasApi.update(id, payload),
);

export const deleteArea = createAsyncThunk('areas/delete', async (id: string) => {
  await areasApi.delete(id);
  return id;
});

const areasSlice = createSlice({
  name: 'areas',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAreas.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAreas.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchAreas.rejected, (state, action) => { state.loading = false; state.error = action.error.message ?? 'Error'; })
      .addCase(createArea.fulfilled, (state, action) => { state.list.push(action.payload); })
      .addCase(updateArea.fulfilled, (state, action) => {
        const idx = state.list.findIndex((a) => a.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(deleteArea.fulfilled, (state, action) => {
        state.list = state.list.filter((a) => a.id !== action.payload);
      });
  },
});

export default areasSlice.reducer;
