export const API_BASE_URL = '/api';

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  PROJECT_DETAIL: '/projects/:id',
  TIMELINE: '/timeline',
  NOTIFICATIONS: '/notifications',
  ACTIVITY: '/activity',
  SETTINGS: '/settings',
} as const;

export const STATUS_CONFIG: Record<string, { label: string; bgClass: string; textClass: string; borderClass: string }> = {
  planning: {
    label: 'Planning',
    bgClass: 'bg-status-planning-bg',
    textClass: 'text-status-planning-text',
    borderClass: 'border-status-planning-border',
  },
  ongoing: {
    label: 'Ongoing',
    bgClass: 'bg-status-ongoing-bg',
    textClass: 'text-status-ongoing-text',
    borderClass: 'border-status-ongoing-border',
  },
  'on-hold': {
    label: 'On Hold',
    bgClass: 'bg-status-onhold-bg',
    textClass: 'text-status-onhold-text',
    borderClass: 'border-status-onhold-border',
  },
  completed: {
    label: 'Completed',
    bgClass: 'bg-status-completed-bg',
    textClass: 'text-status-completed-text',
    borderClass: 'border-status-completed-border',
  },
};

export const ACTION_CONFIG: Record<string, { label: string; color: string }> = {
  project_created: { label: 'Project Created', color: 'text-success' },
  project_updated: { label: 'Project Updated', color: 'text-info' },
  project_status_changed: { label: 'Status Changed', color: 'text-warning' },
  project_progress_updated: { label: 'Progress Updated', color: 'text-info' },
  note_added: { label: 'Note Added', color: 'text-success' },
  note_updated: { label: 'Note Updated', color: 'text-info' },
  note_deleted: { label: 'Note Deleted', color: 'text-danger' },
  wa_connected: { label: 'WA Connected', color: 'text-success' },
  wa_disconnected: { label: 'WA Disconnected', color: 'text-danger' },
  wa_message_sent: { label: 'WA Message Sent', color: 'text-info' },
  notification_sent: { label: 'Notification Sent', color: 'text-info' },
  user_login: { label: 'User Login', color: 'text-text-secondary' },
};

export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/projects', label: 'Projects', icon: 'FolderKanban' },
  { path: '/timeline', label: 'Timeline', icon: 'GanttChart' },
  { path: '/notifications', label: 'Notifications', icon: 'Bell' },
  { path: '/activity', label: 'Activity', icon: 'Activity' },
  { path: '/settings', label: 'Settings', icon: 'Settings' },
] as const;
