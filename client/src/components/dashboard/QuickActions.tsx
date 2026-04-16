import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Send, FileDown, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { useWAStatus, useBroadcastAll } from '../../hooks/useWhatsApp';
import { useDashboard } from '../../hooks/useDashboard';

export function QuickActions() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { data: waStatus } = useWAStatus();
  const { data: dashboardData } = useDashboard();
  const broadcastAll = useBroadcastAll();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const isWAConnected = waStatus?.connected === true;
  const hasOngoingProjects = (dashboardData?.stats?.activeProjects ?? 0) > 0;
  const canSendAll = isWAConnected && hasOngoingProjects;

  const handleNewProject = () => {
    navigate('/projects?action=new');
  };

  const handleSendAllClick = () => {
    if (!canSendAll) {
      if (!isWAConnected) {
        addToast({ type: 'warning', title: 'WhatsApp not connected', message: 'Connect WhatsApp in Settings first' });
      } else {
        addToast({ type: 'info', title: 'No active projects', message: 'There are no ongoing projects to send updates for' });
      }
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSendAll = async () => {
    try {
      const result = await broadcastAll.mutateAsync();
      addToast({ type: 'success', title: 'Updates sent', message: `${result.sent} notifications sent` });
      setShowConfirmModal(false);
    } catch {
      addToast({ type: 'error', title: 'Failed to send updates' });
    }
  };

  const handleExport = () => {
    addToast({ type: 'info', title: 'Export', message: 'Report export coming soon' });
  };

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button icon={<Plus className="w-4 h-4" />} onClick={handleNewProject}>
          New Project
        </Button>
        <Button
          variant="outline"
          icon={<Send className="w-4 h-4" />}
          onClick={handleSendAllClick}
          disabled={!canSendAll}
        >
          Send All Updates
          {!isWAConnected && (
            <span className="text-xs text-text-tertiary ml-1">(WA disconnected)</span>
          )}
        </Button>
        <Button variant="outline" icon={<FileDown className="w-4 h-4" />} onClick={handleExport}>
          Export Report
        </Button>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Send All Updates"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Confirm Broadcast</p>
              <p className="text-xs text-amber-700 mt-1">
                This will send project update notifications to all linked WhatsApp groups for ongoing projects.
                This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button
              icon={<Send className="w-4 h-4" />}
              onClick={handleConfirmSendAll}
              loading={broadcastAll.isPending}
            >
              Send All
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
