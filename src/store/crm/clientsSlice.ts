import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as crmApi from '@/api/crm';
import type { Customer } from '@/types/crm.types';

interface ClientsState {
  list: Customer[];
  loading: boolean;
  error: string | null;
  submitting: boolean;
}

const initialState: ClientsState = {
  list: [],
  loading: false,
  error: null,
  submitting: false,
};

export const fetchCustomers = createAsyncThunk('clients/fetchAll', async () =>
  crmApi.getCustomers(),
);

export const createCustomer = createAsyncThunk(
  'clients/create',
  async (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) =>
    crmApi.createCustomer(data),
);

export const updateCustomer = createAsyncThunk(
  'clients/update',
  async ({ id, data }: { id: string; data: Partial<Customer> }) =>
    crmApi.updateCustomer(id, data),
);

export const deleteCustomer = createAsyncThunk('clients/delete', async (id: string) => {
  await crmApi.deleteCustomer(id);
  return id;
});

const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Error al cargar clientes';
      })

      .addCase(createCustomer.pending, (state) => { state.submitting = true; })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.submitting = false;
        state.list.push(action.payload);
      })
      .addCase(createCustomer.rejected, (state) => { state.submitting = false; })

      .addCase(updateCustomer.pending, (state) => { state.submitting = true; })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.submitting = false;
        const idx = state.list.findIndex((c) => c.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(updateCustomer.rejected, (state) => { state.submitting = false; })

      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.list = state.list.filter((c) => c.id !== action.payload);
      });
  },
});

export default clientsSlice.reducer;
