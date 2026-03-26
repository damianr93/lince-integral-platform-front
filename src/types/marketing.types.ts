export type CampaignStatus = 'DRAFT' | 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export type RecipientStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';

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
  status: CampaignStatus;
  recipientFilter: RecipientFilter;
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
  attempts: number;
  sentAt?: string;
  createdAt: string;
}

export interface YCloudTemplate {
  id: string;
  name: string;
  language: string;
  status: string;
  category: string;
  content: string;
  headerFormat?: string;
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

export interface CreateCampaignPayload {
  name: string;
  templateName: string;
  templateLanguage: string;
  recipientFilter?: RecipientFilter;
}
