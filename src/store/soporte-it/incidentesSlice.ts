import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { soporteItApi } from '@/api/soporte-it';
import type {
  Incidente,
  CreateIncidentePayload,
  UpdateIncidentePayload,
} from '@/types/soporte-it.types';

interface IncidentesState {
  items: Incidente[];
  selected: Incidente | null;
  loading: boolean;
  error: string | null;
}

const initialState: IncidentesState = {
  items: [],
  selected: null,
  loading: false,
  error: null,
};

export const fetchIncidentes = createAsyncThunk('incidentes/fetchAll', () =>
  soporteItApi.getIncidentes(),
);

export const fetchMisIncidentes = createAsyncThunk('incidentes/fetchMine', () =>
  soporteItApi.getMisIncidentes(),
);

export const fetchIncidente = createAsyncThunk(
  'incidentes/fetchOne',
  (id: string) => soporteItApi.getIncidente(id),
);

export const fetchIncidentesByEquipo = createAsyncThunk(
  'incidentes/fetchByEquipo',
  (equipoId: string) => soporteItApi.getIncidentesByEquipo(equipoId),
);

export const createIncidente = createAsyncThunk(
  'incidentes/create',
  (payload: CreateIncidentePayload) => soporteItApi.createIncidente(payload),
);

export const updateIncidenteEstado = createAsyncThunk(
  'incidentes/updateEstado',
  ({ id, payload }: { id: string; payload: UpdateIncidentePayload }) =>
    soporteItApi.updateIncidenteEstado(id, payload),
);

export const deleteIncidente = createAsyncThunk(
  'incidentes/delete',
  (id: string) => soporteItApi.deleteIncidente(id).then(() => id),
);

const incidentesSlice = createSlice({
  name: 'incidentes',
  initialState,
  reducers: {
    clearSelected(state) {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIncidentes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIncidentes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchIncidentes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Error al cargar incidentes';
      })
      .addCase(fetchMisIncidentes.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.items = [];
      })
      .addCase(fetchMisIncidentes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchMisIncidentes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Error al cargar incidentes';
      })
      .addCase(fetchIncidentesByEquipo.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(fetchIncidente.pending, (state) => {
        state.selected = null;
      })
      .addCase(fetchIncidente.fulfilled, (state, action) => {
        state.selected = action.payload;
      })
      .addCase(createIncidente.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateIncidenteEstado.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
        if (state.selected?.id === action.payload.id) state.selected = action.payload;
      })
      .addCase(deleteIncidente.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i.id !== action.payload);
        if (state.selected?.id === action.payload) state.selected = null;
      });
  },
});

export const { clearSelected: clearIncidenteSelected } = incidentesSlice.actions;
export default incidentesSlice.reducer;
