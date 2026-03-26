import { api } from './client';
import type {
  Campaign,
  CampaignRecipient,
  CreateCampaignPayload,
  YCloudTemplate,
} from '@/types/marketing.types';

export const getTemplates = () =>
  api.get<YCloudTemplate[]>('/marketing/templates');

export const getCampaigns = () =>
  api.get<Campaign[]>('/marketing/campaigns');

export const getCampaign = (id: string) =>
  api.get<Campaign>(`/marketing/campaigns/${id}`);

export const createCampaign = (payload: CreateCampaignPayload) =>
  api.post<Campaign>('/marketing/campaigns', payload);

export const executeCampaign = (id: string) =>
  api.post<Campaign>(`/marketing/campaigns/${id}/execute`, {});

export const getCampaignRecipients = (id: string) =>
  api.get<CampaignRecipient[]>(`/marketing/campaigns/${id}/recipients`);
