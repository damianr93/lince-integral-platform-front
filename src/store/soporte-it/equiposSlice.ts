import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { soporteItApi } from '@/api/soporte-it';
import type {
  Equipo,
  CreateEquipoPayload,
  UpdateEquipoPayload,
} from '@/types/soporte-it.types';

interface EquiposState {
  items: Equipo[];
  selected: Equipo | null;
  loading: boolean;
  error: string | null;
}

const initialState: EquiposState = {
  items: [],
  selected: null,
  loading: false,
  error: null,
};

export const fetchEquipos = createAsyncThunk('equipos/fetchAll', () =>
  soporteItApi.getEquipos(),
);

export const fetchMisEquipos = createAsyncThunk('equipos/fetchMine', () =>
  soporteItApi.getMisEquipos(),
);

export const fetchEquipo = createAsyncThunk('equipos/fetchOne', (id: string) =>
  soporteItApi.getEquipo(id),
);

export const createEquipo = createAsyncThunk(
  'equipos/create',
  (payload: CreateEquipoPayload) => soporteItApi.createEquipo(payload),
);

export const updateEquipo = createAsyncThunk(
  'equipos/update',
  ({ id, payload }: { id: string; payload: UpdateEquipoPayload }) =>
    soporteItApi.updateEquipo(id, payload),
);

export const deleteEquipo = createAsyncThunk('equipos/delete', (id: string) =>
  soporteItApi.deleteEquipo(id).then(() => id),
);

const equiposSlice = createSlice({
  name: 'equipos',
  initialState,
  reducers: {
    clearSelected(state) {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch all / fetch mine
      .addCase(fetchEquipos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEquipos.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchEquipos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Error al cargar equipos';
      })
      .addCase(fetchMisEquipos.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.items = [];
      })
      .addCase(fetchMisEquipos.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchMisEquipos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Error al cargar equipos';
      })
      // fetch one
      .addCase(fetchEquipo.pending, (state) => {
        state.selected = null;
      })
      .addCase(fetchEquipo.fulfilled, (state, action) => {
        state.selected = action.payload;
      })
      // create
      .addCase(createEquipo.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      // update
      .addCase(updateEquipo.fulfilled, (state, action) => {
        const idx = state.items.findIndex((e) => e.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
        if (state.selected?.id === action.payload.id) state.selected = action.payload;
      })
      // delete
      .addCase(deleteEquipo.fulfilled, (state, action) => {
        state.items = state.items.filter((e) => e.id !== action.payload);
        if (state.selected?.id === action.payload) state.selected = null;
      });
  },
});

export const { clearSelected } = equiposSlice.actions;
export default equiposSlice.reducer;
