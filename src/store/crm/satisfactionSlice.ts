import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as crmApi from '@/api/crm';
import type { Satisfaction } from '@/types/crm.types';

interface SatisfactionState {
  list: Satisfaction[];
  loading: boolean;
  error: string | null;
  submitting: boolean;
}

const initialState: SatisfactionState = {
  list: [],
  loading: false,
  error: null,
  submitting: false,
};

export const fetchSatisfactions = createAsyncThunk('satisfaction/fetchAll', async () =>
  crmApi.getSatisfactions(),
);

export const createSatisfaction = createAsyncThunk(
  'satisfaction/create',
  async (data: Omit<Satisfaction, 'id' | 'createdAt'>) => crmApi.createSatisfaction(data),
);

export const updateSatisfaction = createAsyncThunk(
  'satisfaction/update',
  async ({ id, data }: { id: string; data: Partial<Satisfaction> }) =>
    crmApi.updateSatisfaction(id, data),
);

export const deleteSatisfaction = createAsyncThunk(
  'satisfaction/delete',
  async (id: string) => {
    await crmApi.deleteSatisfaction(id);
    return id;
  },
);

const satisfactionSlice = createSlice({
  name: 'satisfaction',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSatisfactions.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSatisfactions.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchSatisfactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Error';
      })

      .addCase(createSatisfaction.pending, (state) => { state.submitting = true; })
      .addCase(createSatisfaction.fulfilled, (state, action) => {
        state.submitting = false;
        state.list.push(action.payload);
      })
      .addCase(createSatisfaction.rejected, (state) => { state.submitting = false; })

      .addCase(updateSatisfaction.pending, (state) => { state.submitting = true; })
      .addCase(updateSatisfaction.fulfilled, (state, action) => {
        state.submitting = false;
        const idx = state.list.findIndex((s) => s.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(updateSatisfaction.rejected, (state) => { state.submitting = false; })

      .addCase(deleteSatisfaction.fulfilled, (state, action) => {
        state.list = state.list.filter((s) => s.id !== action.payload);
      });
  },
});

export default satisfactionSlice.reducer;
