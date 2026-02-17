import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { usePreferences, useUpdatePreferences } from '../hooks/usePreferences';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { PageSkeleton } from '../components/ui/Skeleton';

export default function Preferences() {
  const { data: prefs, isLoading } = usePreferences();
  const updatePrefs = useUpdatePreferences();

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [notifyOnCompletion, setNotifyOnCompletion] = useState(true);
  const [notifyOnError, setNotifyOnError] = useState(true);
  const [retentionDays, setRetentionDays] = useState(90);
  const [autoArchive, setAutoArchive] = useState(false);
  const [defaultPageSize, setDefaultPageSize] = useState(25);

  useEffect(() => {
    if (prefs) {
      setEmailNotifications(prefs.email_notifications);
      setNotifyOnCompletion(prefs.notify_on_completion);
      setNotifyOnError(prefs.notify_on_error);
      setRetentionDays(prefs.retention_days);
      setAutoArchive(prefs.auto_archive);
      setDefaultPageSize(prefs.default_page_size);
    }
  }, [prefs]);

  const handleSave = () => {
    updatePrefs.mutate(
      {
        email_notifications: emailNotifications,
        notify_on_completion: notifyOnCompletion,
        notify_on_error: notifyOnError,
        retention_days: retentionDays,
        auto_archive: autoArchive,
        default_page_size: defaultPageSize,
      },
      {
        onSuccess: () => toast.success('Preferences saved'),
        onError: () => toast.error('Failed to save preferences'),
      }
    );
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-efx-gray-900">Preferences</h1>
        <Button variant="primary" onClick={handleSave} isLoading={updatePrefs.isPending}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Notifications */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-efx-gray-900 mb-4">Notifications</h2>
        <div className="space-y-4">
          <Toggle
            label="Email Notifications"
            description="Receive email notifications for run events"
            checked={emailNotifications}
            onChange={setEmailNotifications}
          />
          <Toggle
            label="Notify on Completion"
            description="Send notification when a run completes successfully"
            checked={notifyOnCompletion}
            onChange={setNotifyOnCompletion}
          />
          <Toggle
            label="Notify on Error"
            description="Send notification when a run fails"
            checked={notifyOnError}
            onChange={setNotifyOnError}
          />
        </div>
      </Card>

      {/* Data Retention */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-efx-gray-900 mb-4">Data Retention</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-efx-gray-700 mb-1">
              Retention Period
            </label>
            <select
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              className="w-full px-3 py-2 border border-efx-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-efx-red"
            >
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
              <option value={365}>1 year</option>
            </select>
          </div>
          <Toggle
            label="Auto-Archive"
            description="Automatically archive runs after retention period"
            checked={autoArchive}
            onChange={setAutoArchive}
          />
        </div>
      </Card>

      {/* Display */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-efx-gray-900 mb-4">Display</h2>
        <div>
          <label className="block text-sm font-medium text-efx-gray-700 mb-1">
            Default Page Size
          </label>
          <select
            value={defaultPageSize}
            onChange={(e) => setDefaultPageSize(Number(e.target.value))}
            className="w-full px-3 py-2 border border-efx-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-efx-red"
          >
            <option value={10}>10 results per page</option>
            <option value={25}>25 results per page</option>
            <option value={50}>50 results per page</option>
            <option value={100}>100 results per page</option>
          </select>
        </div>
      </Card>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium text-efx-gray-900">{label}</div>
        <div className="text-sm text-efx-gray-400">{description}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-efx-red' : 'bg-efx-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
