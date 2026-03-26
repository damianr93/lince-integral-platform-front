import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as marketingApi from '@/api/marketing';
import type {
  Campaign,
  CampaignRecipient,
  CreateCampaignPayload,
  YCloudTemplate,
} from '@/types/marketing.types';

interface MarketingState {
  campaigns: Campaign[];
  currentCampaign: Campaign | null;
  recipients: CampaignRecipient[];
  templates: YCloudTemplate[];
  loadingCampaigns: boolean;
  loadingCurrent: boolean;
  loadingRecipients: boolean;
  loadingTemplates: boolean;
  submitting: boolean;
  error: string | null;
}

const initialState: MarketingState = {
  campaigns: [],
  currentCampaign: null,
  recipients: [],
  templates: [],
  loadingCampaigns: false,
  loadingCurrent: false,
  loadingRecipients: false,
  loadingTemplates: false,
  submitting: false,
  error: null,
};

export const fetchTemplates = createAsyncThunk('marketing/fetchTemplates', () =>
  marketingApi.getTemplates(),
);

export const fetchCampaigns = createAsyncThunk('marketing/fetchCampaigns', () =>
  marketingApi.getCampaigns(),
);

export const fetchCampaign = createAsyncThunk('marketing/fetchCampaign', (id: string) =>
  marketingApi.getCampaign(id),
);

export const fetchRecipients = createAsyncThunk('marketing/fetchRecipients', (id: string) =>
  marketingApi.getCampaignRecipients(id),
);

export const createCampaign = createAsyncThunk(
  'marketing/createCampaign',
  (payload: CreateCampaignPayload) => marketingApi.createCampaign(payload),
);

export const executeCampaign = createAsyncThunk('marketing/executeCampaign', (id: string) =>
  marketingApi.executeCampaign(id),
);

export const deleteCampaign = createAsyncThunk('marketing/deleteCampaign', (id: string) =>
  marketingApi.deleteCampaign(id).then(() => id),
);

const campaignsSlice = createSlice({
  name: 'marketing',
  initialState,
  reducers: {
    clearCurrentCampaign(state) {
      state.currentCampaign = null;
      state.recipients = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // templates
      .addCase(fetchTemplates.pending, (state) => { state.loadingTemplates = true; state.error = null; })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.loadingTemplates = false;
        state.templates = action.payload;
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.loadingTemplates = false;
        state.error = action.error.message ?? 'Error al cargar plantillas';
      })

      // campaigns list
      .addCase(fetchCampaigns.pending, (state) => { state.loadingCampaigns = true; state.error = null; })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.loadingCampaigns = false;
        state.campaigns = action.payload;
      })
      .addCase(fetchCampaigns.rejected, (state, action) => {
        state.loadingCampaigns = false;
        state.error = action.error.message ?? 'Error al cargar campañas';
      })

      // single campaign
      .addCase(fetchCampaign.pending, (state) => { state.loadingCurrent = true; state.error = null; })
      .addCase(fetchCampaign.fulfilled, (state, action) => {
        state.loadingCurrent = false;
        state.currentCampaign = action.payload;
      })
      .addCase(fetchCampaign.rejected, (state, action) => {
        state.loadingCurrent = false;
        state.error = action.error.message ?? 'Error al cargar campaña';
      })

      // recipients
      .addCase(fetchRecipients.pending, (state) => { state.loadingRecipients = true; })
      .addCase(fetchRecipients.fulfilled, (state, action) => {
        state.loadingRecipients = false;
        state.recipients = action.payload;
      })
      .addCase(fetchRecipients.rejected, (state) => { state.loadingRecipients = false; })

      // create
      .addCase(createCampaign.pending, (state) => { state.submitting = true; state.error = null; })
      .addCase(createCampaign.fulfilled, (state, action) => {
        state.submitting = false;
        state.campaigns.unshift(action.payload);
      })
      .addCase(createCampaign.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.error.message ?? 'Error al crear campaña';
      })

      // execute
      .addCase(executeCampaign.pending, (state) => { state.submitting = true; })
      .addCase(executeCampaign.fulfilled, (state, action) => {
        state.submitting = false;
        state.currentCampaign = action.payload;
        const idx = state.campaigns.findIndex((c) => c.id === action.payload.id);
        if (idx !== -1) state.campaigns[idx] = action.payload;
      })
      .addCase(executeCampaign.rejected, (state) => { state.submitting = false; })

      // delete
      .addCase(deleteCampaign.pending, (state) => { state.submitting = true; })
      .addCase(deleteCampaign.fulfilled, (state, action) => {
        state.submitting = false;
        state.campaigns = state.campaigns.filter((c) => c.id !== action.payload);
      })
      .addCase(deleteCampaign.rejected, (state) => { state.submitting = false; });
  },
});

export const { clearCurrentCampaign } = campaignsSlice.actions;
export default campaignsSlice.reducer;
