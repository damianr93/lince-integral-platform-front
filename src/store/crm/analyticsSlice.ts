import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as crmApi from '@/api/crm';
import type { FollowUpEvent } from '@/types/crm.types';

interface TotalesData {
  totalContacts: number;
  totalReconsultas: number;
  firstTimeContacts: number;
  byChannel: { channel: string; total: number }[];
}
interface EvolutionPoint { date: string; total: number; }
interface ProductData { product: string; total: number; }
interface StatusPoint { status: string; total: number; percentage: number; }
export interface YearlyComparisonPoint extends Record<string, number | string> { month: number; }
export interface LocationSummary {
  coveragePercent: number;
  topProvinces: { name: string; count: number }[];
  topLocalities: { name: string; count: number }[];
}
export interface ComparisonSnapshot {
  byChannel: { channel: string; total: number }[];
  byProduct: { product: string; total: number }[];
  statusPurchase: { status: string; total: number }[];
}

interface AnalyticsState {
  totales: TotalesData | null;
  evolution: EvolutionPoint[];
  yearlyComparison: YearlyComparisonPoint[];
  byProduct: ProductData[];
  statusPurchase: StatusPoint[];
  followUpEvents: FollowUpEvent[];
  locationSummary: LocationSummary | null;
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  totales: null,
  evolution: [],
  yearlyComparison: [],
  byProduct: [],
  statusPurchase: [],
  followUpEvents: [],
  locationSummary: null,
  loading: false,
  error: null,
};

export const fetchAnalyticsTotales = createAsyncThunk(
  'analytics/fetchTotales',
  async (year: number) => crmApi.getAnalyticsTotales(year),
);

export const fetchAnalyticsEvolution = createAsyncThunk(
  'analytics/fetchEvolution',
  async (year: number) => crmApi.getAnalyticsEvolution(year),
);

export const fetchAnalyticsYearlyComparison = createAsyncThunk(
  'analytics/fetchYearlyComparison',
  async (years: number[]) => crmApi.getAnalyticsYearlyComparison(years),
);

export const fetchAnalyticsDemand = createAsyncThunk(
  'analytics/fetchDemand',
  async (year: number) => crmApi.getAnalyticsDemandOfProduct(year),
);

export const fetchAnalyticsStatus = createAsyncThunk(
  'analytics/fetchStatus',
  async (year: number) => crmApi.getAnalyticsStatus(year),
);

export const fetchFollowUpEvents = createAsyncThunk(
  'analytics/fetchFollowUpEvents',
  async (params: { assignedTo?: string; status?: string }) =>
    crmApi.getFollowUpEvents(params),
);

export const completeFollowUpEvent = createAsyncThunk(
  'analytics/completeFollowUpEvent',
  async (id: string) => crmApi.updateFollowUpEventStatus(id, { status: 'COMPLETED' }),
);

export const fetchComparisonSnapshot = createAsyncThunk(
  'analytics/fetchComparisonSnapshot',
  async (year: number): Promise<ComparisonSnapshot> => {
    const [totales, byProduct, statusPurchase] = await Promise.all([
      crmApi.getAnalyticsTotales(year),
      crmApi.getAnalyticsDemandOfProduct(year),
      crmApi.getAnalyticsStatus(year),
    ]);
    return {
      byChannel: totales.byChannel,
      byProduct,
      statusPurchase,
    };
  },
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearAnalytics() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalyticsTotales.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAnalyticsTotales.fulfilled, (state, action) => {
        state.loading = false;
        state.totales = action.payload;
      })
      .addCase(fetchAnalyticsTotales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Error';
      })

      .addCase(fetchAnalyticsEvolution.fulfilled, (state, action) => {
        state.evolution = action.payload;
      })

      .addCase(fetchAnalyticsYearlyComparison.fulfilled, (state, action) => {
        state.yearlyComparison = action.payload as YearlyComparisonPoint[];
      })

      .addCase(fetchAnalyticsDemand.fulfilled, (state, action) => {
        state.byProduct = action.payload;
      })

      .addCase(fetchAnalyticsStatus.fulfilled, (state, action) => {
        state.statusPurchase = action.payload;
      })

      .addCase(fetchFollowUpEvents.fulfilled, (state, action) => {
        state.followUpEvents = action.payload;
      })

      .addCase(completeFollowUpEvent.fulfilled, (state, action) => {
        const updated = action.payload;
        state.followUpEvents = state.followUpEvents.map((e) =>
          e.id === updated.id ? updated : e,
        );
      });
  },
});

export const { clearAnalytics } = analyticsSlice.actions;
export default analyticsSlice.reducer;
