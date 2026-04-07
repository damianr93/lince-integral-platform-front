import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { soporteItApi } from '@/api/soporte-it';
import type {
  Relevamiento,
  CreateRelevamientoPayload,
  UpdateRelevamientoPayload,
} from '@/types/soporte-it.types';

interface RelevamientosState {
  current: Relevamiento | null;
  loading: boolean;
  error: string | null;
}

const initialState: RelevamientosState = {
  current: null,
  loading: false,
  error: null,
};

export const fetchRelevamientoByIncidente = createAsyncThunk(
  'relevamientos/fetchByIncidente',
  (incidenteId: string) => soporteItApi.getRelevamientoByIncidente(incidenteId),
);

export const createRelevamiento = createAsyncThunk(
  'relevamientos/create',
  (payload: CreateRelevamientoPayload) => soporteItApi.createRelevamiento(payload),
);

export const updateRelevamiento = createAsyncThunk(
  'relevamientos/update',
  ({ id, payload }: { id: string; payload: UpdateRelevamientoPayload }) =>
    soporteItApi.updateRelevamiento(id, payload),
);

const relevamientosSlice = createSlice({
  name: 'relevamientos',
  initialState,
  reducers: {
    clearRelevamiento(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRelevamientoByIncidente.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRelevamientoByIncidente.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchRelevamientoByIncidente.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Error al cargar relevamiento';
      })
      .addCase(createRelevamiento.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(updateRelevamiento.fulfilled, (state, action) => {
        state.current = action.payload;
      });
  },
});

export const { clearRelevamiento } = relevamientosSlice.actions;
export default relevamientosSlice.reducer;
