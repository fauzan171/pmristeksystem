// User & Auth
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'pm' | 'admin';
  avatar?: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

// Project
export type ProjectStatus = 'planning' | 'ongoing' | 'on-hold' | 'completed';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  startDate: string;
  endDate: string;
  pmId: string;
  pmName: string;
  waGroupId?: string;
  waGroupName?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  waGroupId?: string;
  waGroupName?: string;
  tags?: string[];
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  progress?: number;
  startDate?: string;
  endDate?: string;
  waGroupId?: string;
  waGroupName?: string;
  tags?: string[];
}

// Note
export interface Note {
  id: string;
  projectId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteRequest {
  content: string;
}

export interface UpdateNoteRequest {
  content: string;
}

// Activity Log
export type ActionType =
  | 'project_created'
  | 'project_updated'
  | 'project_status_changed'
  | 'project_progress_updated'
  | 'note_added'
  | 'note_updated'
  | 'note_deleted'
  | 'wa_connected'
  | 'wa_disconnected'
  | 'wa_message_sent'
  | 'notification_sent'
  | 'user_login';

export interface ActivityLog {
  id: string;
  projectId?: string;
  projectName?: string;
  userId: string;
  userName: string;
  action: ActionType;
  details: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// Notification
export type NotificationType = 'deadline_reminder' | 'status_update' | 'overdue_reminder' | 'progress_update' | 'wa_message';
export type NotificationTrigger = 'auto' | 'manual';
export type NotificationStatus = 'pending' | 'sent' | 'failed';

export interface Notification {
  id: string;
  projectId: string;
  projectName: string;
  type: NotificationType;
  trigger: NotificationTrigger;
  channel: 'whatsapp' | 'email' | 'in_app';
  status: NotificationStatus;
  message: string;
  recipient?: string;
  errorMessage?: string;
  sentAt?: string;
  createdAt: string;
}

// WhatsApp
export interface WAConnectionStatus {
  connected: boolean;
  phoneNumber?: string;
  qrCode?: string;
  groupName?: string;
  lastSync?: string;
}

export interface WAGroup {
  id: string;
  name: string;
  participants: number;
}

export interface WASendMessageRequest {
  projectId: string;
  message: string;
}

// Dashboard
export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  overdueProjects: number;
  upcomingDeadlines: number;
}

export interface DeadlineAlert {
  projectId: string;
  projectName: string;
  endDate: string;
  daysRemaining: number;
  status: ProjectStatus;
  progress: number;
}

export interface StatusDistribution {
  status: ProjectStatus;
  count: number;
  percentage: number;
}

export interface DashboardData {
  stats: DashboardStats;
  upcomingDeadlines: DeadlineAlert[];
  overdueProjects: DeadlineAlert[];
  statusDistribution: StatusDistribution[];
  recentActivity: ActivityLog[];
}

// Settings
export interface AppSettings {
  waApiKey?: string;
  waPhoneNumber?: string;
  notificationPreferences: {
    deadlineReminders: boolean;
    deadlineDaysBefore: number;
    deadlineReminderDays: number[];
    overdueNotifications: boolean;
    overdueInterval: 'daily' | 'every-2-days' | 'weekly';
    notifyTime: string;
    statusUpdates: boolean;
    emailNotifications: boolean;
    waNotifications: boolean;
  };
  templates?: {
    deadline?: string;
    overdue?: string;
    progress?: string;
  };
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProjectStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Toast
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}
