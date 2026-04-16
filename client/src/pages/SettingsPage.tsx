import { useState, useEffect } from 'react';
import {
  Save,
  MessageSquare,
  Bell,
  User,
  QrCode,
  RefreshCw,
  LogOut,
  Lock,
  Clock,
  Calendar,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api/settings.api';
import { useWAStatus, useWAConnect, useWADisconnect } from '../hooks/useWhatsApp';
import { useAuth } from '../hooks/useAuth';

type SettingsTab = 'whatsapp' | 'notifications' | 'templates' | 'account';

const TABS: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { key: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare className="w-4 h-4" /> },
  { key: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  { key: 'templates', label: 'Templates', icon: <MessageSquare className="w-4 h-4" /> },
  { key: 'account', label: 'Account', icon: <User className="w-4 h-4" /> },
];

const DEADLINE_DAY_OPTIONS = [1, 2, 3, 5, 7];
const OVERDUE_INTERVAL_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'every-2-days', label: 'Every 2 days' },
  { value: 'weekly', label: 'Weekly' },
];

export function SettingsPage() {
  const { addToast } = useToast();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettingsTab>('whatsapp');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get(),
  });

  const { data: waStatus } = useWAStatus();
  const waConnect = useWAConnect();
  const waDisconnect = useWADisconnect();

  const updateSettings = useMutation({
    mutationFn: (data: Record<string, unknown>) => settingsApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      addToast({ type: 'success', title: 'Settings saved' });
    },
    onError: () => {
      addToast({ type: 'error', title: 'Failed to save settings' });
    },
  });

  // WhatsApp form state
  const [waApiKey, setWaApiKey] = useState('');
  const [waPhone, setWaPhone] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);

  // Notification schedule state
  const [deadlineReminders, setDeadlineReminders] = useState(true);
  const [deadlineReminderDays, setDeadlineReminderDays] = useState<number[]>([3, 5]);
  const [overdueNotifications, setOverdueNotifications] = useState(true);
  const [overdueInterval, setOverdueInterval] = useState<string>('daily');
  const [notifyTime, setNotifyTime] = useState('09:00');
  const [statusUpdates, setStatusUpdates] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(false);
  const [waNotifs, setWaNotifs] = useState(true);

  // Templates state
  const [deadlineTemplate, setDeadlineTemplate] = useState(
    'Hi team, this is a reminder that "{{project_name}}" is due in {{days}} days ({{deadline}}). Current progress: {{progress}}%.'
  );
  const [overdueTemplate, setOverdueTemplate] = useState(
    'Attention: "{{project_name}}" is now {{days_overdue}} days overdue. The deadline was {{deadline}}. Current progress: {{progress}}%. Please take immediate action.'
  );
  const [progressTemplate, setProgressTemplate] = useState(
    'Update: "{{project_name}}" status has changed to {{status}}. Progress: {{progress}}%.'
  );

  // Sync settings when loaded
  useEffect(() => {
    if (settings) {
      setWaApiKey(settings.waApiKey || '');
      setWaPhone(settings.waPhoneNumber || '');
      const prefs = settings.notificationPreferences;
      setDeadlineReminders(prefs?.deadlineReminders ?? true);
      setDeadlineReminderDays(prefs?.deadlineReminderDays ?? [3, 5]);
      setOverdueNotifications(prefs?.overdueNotifications ?? true);
      setOverdueInterval(prefs?.overdueInterval ?? 'daily');
      setNotifyTime(prefs?.notifyTime ?? '09:00');
      setStatusUpdates(prefs?.statusUpdates ?? true);
      setEmailNotifs(prefs?.emailNotifications ?? false);
      setWaNotifs(prefs?.waNotifications ?? true);
      if (settings.templates) {
        setDeadlineTemplate(settings.templates.deadline || deadlineTemplate);
        setOverdueTemplate(settings.templates.overdue || overdueTemplate);
        setProgressTemplate(settings.templates.progress || progressTemplate);
      }
    }
  }, [settings]);

  const handleSaveSettings = (section: string) => {
    const data: Record<string, unknown> = {};
    if (section === 'whatsapp') {
      data.waApiKey = waApiKey;
      data.waPhoneNumber = waPhone;
    } else if (section === 'notifications') {
      data.notificationPreferences = {
        deadlineReminders,
        deadlineReminderDays,
        deadlineDaysBefore: deadlineReminderDays[0] || 3,
        overdueNotifications,
        overdueInterval,
        notifyTime,
        statusUpdates,
        emailNotifications: emailNotifs,
        waNotifications: waNotifs,
      };
    } else if (section === 'templates') {
      data.templates = {
        deadline: deadlineTemplate,
        overdue: overdueTemplate,
        progress: progressTemplate,
      };
    }
    updateSettings.mutate(data);
  };

  const handleConnect = () => {
    waConnect.mutate(undefined, {
      onSuccess: () => {
        setShowQRModal(true);
        addToast({ type: 'success', title: 'QR code generated. Scan with WhatsApp.' });
      },
      onError: () => {
        addToast({ type: 'error', title: 'Failed to connect WhatsApp' });
      },
    });
  };

  const handleDisconnect = () => {
    waDisconnect.mutate(undefined, {
      onSuccess: () => {
        addToast({ type: 'success', title: 'WhatsApp disconnected' });
      },
      onError: () => {
        addToast({ type: 'error', title: 'Failed to disconnect WhatsApp' });
      },
    });
  };

  const toggleDeadlineDay = (day: number) => {
    setDeadlineReminderDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-white rounded-xl border border-warm-400 p-6 h-48" />
        <div className="animate-pulse bg-white rounded-xl border border-warm-400 p-6 h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Tab Navigation */}
      <div className="flex gap-1 bg-white rounded-xl border border-warm-400 p-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex-1 justify-center ${
              activeTab === tab.key
                ? 'bg-coral text-white'
                : 'text-text-secondary hover:bg-warm-100 hover:text-text-primary'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Section 1: WhatsApp Configuration */}
      {activeTab === 'whatsapp' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-coral" />
              <CardTitle>WhatsApp Configuration</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-5">
            {/* Connection Status */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-warm-100 border border-warm-400">
              <div className="flex items-center gap-3">
                <div className={`w-3.5 h-3.5 rounded-full ${waStatus?.connected ? 'bg-success' : 'bg-danger'}`} />
                <div>
                  <span className="text-sm font-medium text-text-primary">
                    {waStatus?.connected ? `Connected (${waStatus.phoneNumber || 'Active'})` : 'Disconnected'}
                  </span>
                  {waStatus?.connected && waStatus.lastSync && (
                    <p className="text-xs text-text-tertiary mt-0.5">
                      Last sync: {new Date(waStatus.lastSync).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              {waStatus?.connected ? (
                <Button variant="outline" size="sm" onClick={handleDisconnect} loading={waDisconnect.isPending}>
                  Disconnect
                </Button>
              ) : (
                <Button size="sm" icon={<QrCode className="w-4 h-4" />} onClick={handleConnect} loading={waConnect.isPending}>
                  Connect via QR Code
                </Button>
              )}
            </div>

            {/* API Config */}
            <Input
              label="WhatsApp API Key"
              value={waApiKey}
              onChange={(e) => setWaApiKey(e.target.value)}
              type="password"
              placeholder="Enter your WA API key"
            />
            <Input
              label="WhatsApp Phone Number"
              value={waPhone}
              onChange={(e) => setWaPhone(e.target.value)}
              placeholder="+62..."
            />

            <div className="flex justify-end pt-2">
              <Button
                icon={<Save className="w-4 h-4" />}
                onClick={() => handleSaveSettings('whatsapp')}
                loading={updateSettings.isPending}
              >
                Save Settings
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Section 2: Notification Schedule */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-coral" />
              <CardTitle>Notification Schedule</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-5">
            {/* Deadline Reminder Days */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Deadline reminder days
              </label>
              <p className="text-xs text-text-tertiary mb-3">
                Select how many days before the deadline to send reminders
              </p>
              <div className="flex gap-2 flex-wrap">
                {DEADLINE_DAY_OPTIONS.map((day) => (
                  <button
                    key={day}
                    onClick={() => toggleDeadlineDay(day)}
                    className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      deadlineReminderDays.includes(day)
                        ? 'bg-coral text-white border-coral'
                        : 'bg-white text-text-secondary border-warm-400 hover:bg-warm-100'
                    }`}
                  >
                    {day}d
                  </button>
                ))}
              </div>
            </div>

            {/* Overdue Notifications */}
            <ToggleRow
              label="Overdue notifications"
              description="Send repeated reminders for overdue projects"
              checked={overdueNotifications}
              onChange={setOverdueNotifications}
            />
            {overdueNotifications && (
              <Select
                label="Overdue reminder interval"
                value={overdueInterval}
                onChange={(e) => setOverdueInterval(e.target.value)}
                options={OVERDUE_INTERVAL_OPTIONS}
              />
            )}

            {/* Notify Time */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
                <Clock className="w-4 h-4 text-text-tertiary" />
                Notification time
              </label>
              <Input
                type="time"
                value={notifyTime}
                onChange={(e) => setNotifyTime(e.target.value)}
              />
            </div>

            <hr className="border-warm-400" />

            <ToggleRow
              label="Status Updates"
              description="Send notifications when project status changes"
              checked={statusUpdates}
              onChange={setStatusUpdates}
            />
            <ToggleRow
              label="Email Notifications"
              description="Also send notifications via email"
              checked={emailNotifs}
              onChange={setEmailNotifs}
            />
            <ToggleRow
              label="WhatsApp Notifications"
              description="Send notifications via WhatsApp"
              checked={waNotifs}
              onChange={setWaNotifs}
            />

            <div className="flex justify-end pt-2">
              <Button
                icon={<Save className="w-4 h-4" />}
                onClick={() => handleSaveSettings('notifications')}
                loading={updateSettings.isPending}
              >
                Save Settings
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Section 3: Message Templates */}
      {activeTab === 'templates' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-coral" />
              <CardTitle>Message Templates</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-5">
            <div>
              <Textarea
                label="Deadline Reminder Template"
                value={deadlineTemplate}
                onChange={(e) => setDeadlineTemplate(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-text-tertiary mt-1.5">
                Variables: {'{{project_name}}'}, {'{{days}}'}, {'{{deadline}}'}, {'{{progress}}'}
              </p>
            </div>

            <div>
              <Textarea
                label="Overdue Reminder Template"
                value={overdueTemplate}
                onChange={(e) => setOverdueTemplate(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-text-tertiary mt-1.5">
                Variables: {'{{project_name}}'}, {'{{days_overdue}}'}, {'{{deadline}}'}, {'{{progress}}'}
              </p>
            </div>

            <div>
              <Textarea
                label="Progress Update Template"
                value={progressTemplate}
                onChange={(e) => setProgressTemplate(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-text-tertiary mt-1.5">
                Variables: {'{{project_name}}'}, {'{{status}}'}, {'{{progress}}'}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                icon={<Save className="w-4 h-4" />}
                onClick={() => handleSaveSettings('templates')}
                loading={updateSettings.isPending}
              >
                Save Templates
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Section 4: Account */}
      {activeTab === 'account' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-coral" />
              <CardTitle>Account</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-coral flex items-center justify-center text-white text-lg font-semibold">
                {user?.name.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 space-y-3">
                <Input
                  label="Display Name"
                  value={user?.name || ''}
                  readOnly
                  className="bg-warm-100"
                />
                <Input
                  label="Email"
                  value={user?.email || ''}
                  readOnly
                  className="bg-warm-100"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-text-tertiary">
              <Calendar className="w-3.5 h-3.5" />
              Role: <span className="capitalize text-text-secondary">{user?.role || 'pm'}</span>
            </div>

            <hr className="border-warm-400" />

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                icon={<Lock className="w-4 h-4" />}
                onClick={() => addToast({ type: 'info', title: 'Password change', message: 'Feature coming soon' })}
              >
                Change Password
              </Button>
              <Button
                variant="danger"
                icon={<LogOut className="w-4 h-4" />}
                onClick={logout}
              >
                Logout
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* QR Code Modal */}
      <Modal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title="Scan QR Code"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex flex-col items-center py-4">
            {waStatus?.qrCode ? (
              <div className="p-4 bg-white border-2 border-warm-400 rounded-xl">
                <img
                  src={waStatus.qrCode}
                  alt="WhatsApp QR Code"
                  className="w-64 h-64"
                />
              </div>
            ) : (
              <div className="w-64 h-64 bg-warm-100 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <QrCode className="w-12 h-12 text-text-tertiary mx-auto mb-2" />
                  <p className="text-sm text-text-tertiary">Generating QR code...</p>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-text-primary text-center">How to connect:</p>
            <ol className="text-xs text-text-secondary space-y-1.5 list-decimal list-inside">
              <li>Open WhatsApp on your phone</li>
              <li>Go to Settings &gt; Linked Devices</li>
              <li>Tap "Link a device"</li>
              <li>Scan the QR code above</li>
            </ol>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-text-tertiary">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Polling for connection status...
          </div>
          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => setShowQRModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-secondary">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center ${
          checked ? 'bg-coral justify-end' : 'bg-warm-300 justify-start'
        }`}
      >
        <div className="w-5 h-5 rounded-full bg-white shadow mx-1 transition-all" />
      </button>
    </div>
  );
}
