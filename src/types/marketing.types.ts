export type CampaignStatus = 'DRAFT' | 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export type RecipientStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';
export type WaveStatus = 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export type LogLevel = 'INFO' | 'WARN' | 'ERROR';
export type LogEvent =
  | 'CAMPAIGN_STARTED'
  | 'CAMPAIGN_COMPLETED'
  | 'WAVE_STARTED'
  | 'WAVE_COMPLETED'
  | 'WAVE_FAILED'
  | 'MESSAGE_SENT'
  | 'MESSAGE_FAILED'
  | 'MESSAGE_RETRY';

export interface CampaignWave {
  waveNumber: number;
  scheduledAt: string;
  recipientCount: number;
  status: WaveStatus;
  sentCount: number;
  failedCount: number;
  startedAt?: string;
  completedAt?: string;
}

export interface CampaignLog {
  id: string;
  campaignId: string;
  waveNumber?: number;
  level: LogLevel;
  event: LogEvent;
  recipientPhone?: string;
  details?: string;
  createdAt: string;
}

export interface RecipientFilter {
  siguiendo?: string[];
  estado?: string[];
  producto?: string[];
}

export interface Campaign {
  id: string;
  name: string;
  templateName: string;
  templateLanguage: string;
  templateHeaderImageUrl?: string;
  status: CampaignStatus;
  recipientFilter: RecipientFilter;
  waves?: CampaignWave[];
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  pendingCount: number;
  createdBy: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignRecipient {
  id: string;
  campaignId: string;
  customerId: string;
  customerName?: string;
  customerPhone: string;
  siguiendo: string;
  phoneNumberId: string;
  status: RecipientStatus;
  yCloudMessageId?: string;
  skipReason?: string;
  errorMessage?: string;
  waveNumber?: number;
  attempts: number;
  sentAt?: string;
  createdAt: string;
}

export interface YCloudTemplate {
  id: string;
  wabaId: string;
  name: string;
  language: string;
  status: string;
  category: string;
  content: string;
  channelLabel?: string | null;
  headerFormat?: string;
  headerExample?: string;
  footerText?: string;
  buttons?: { type: string; text: string }[];
}

export interface DirectMessage {
  id: string;
  phone: string;
  advisor: string;
  templateName: string;
  templateLanguage: string;
  yCloudMessageId: string;
  sentBy: string;
  createdAt: string;
}

export interface CampaignPreviewItem {
  customerId: string;
  customerName: string;
  customerPhone: string;
  siguiendo: string;
  phoneNumberId: string;
  estado: string;
  producto: string;
  willSend: boolean;
  skipReason?: string;
}

export interface CreateCampaignWaveInput {
  scheduledAt: string;
  recipientCount: number;
}

export interface CreateCampaignPayload {
  name: string;
  templateName: string;
  templateLanguage: string;
  templateHeaderImageUrl?: string;
  recipientFilter?: RecipientFilter;
  waves?: CreateCampaignWaveInput[];
}
