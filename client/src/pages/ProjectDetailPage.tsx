import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Plus,
  Send,
  MessageSquare,
  StickyNote,
  Calendar,
  User,
  Bell,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Modal } from '../components/ui/Modal';
import { Textarea } from '../components/ui/Input';
import { SkeletonCard, SkeletonList } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import { useProject, useUpdateProject, useProjectNotes, useCreateNote, useUpdateNote, useDeleteNote, useDeleteProject } from '../hooks/useProjects';
import { useActivity } from '../hooks/useActivity';
import { useWAStatus, useSendNotification } from '../hooks/useWhatsApp';
import { notificationsApi } from '../api/notifications.api';
import { formatDate, formatRelative } from '../utils/format';
import { STATUS_CONFIG, ACTION_CONFIG } from '../utils/constants';
import type { Note } from '../types';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const { data: project, isLoading: projectLoading } = useProject(id || '');
  const { data: notesData } = useProjectNotes(id || '');
  const { data: activityData } = useActivity(id || '');
  const { data: waStatus } = useWAStatus();
  const sendNotification = useSendNotification();

  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const [progressValue, setProgressValue] = useState<number | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendType, setSendType] = useState<'update' | 'deadline'>('update');
  const [sendPreviewMessage, setSendPreviewMessage] = useState('');

  const notes = notesData || [];
  const activities = activityData?.data || [];

  const isWAConnected = waStatus?.connected === true;
  const hasWAGroup = !!project?.waGroupId;

  const handleProgressChange = async () => {
    if (progressValue === null || !id) return;
    try {
      await updateProject.mutateAsync({ id, data: { progress: progressValue } });
      setProgressValue(null);
      addToast({ type: 'success', title: 'Progress updated' });
    } catch {
      addToast({ type: 'error', title: 'Failed to update progress' });
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteProject.mutateAsync(id);
      addToast({ type: 'success', title: 'Project deleted' });
      navigate('/projects');
    } catch {
      addToast({ type: 'error', title: 'Failed to delete project' });
    }
  };

  const handleSaveNote = async () => {
    if (!noteContent.trim() || !id) return;
    try {
      if (editingNote) {
        await updateNote.mutateAsync({ projectId: id, noteId: editingNote.id, data: { content: noteContent } });
        addToast({ type: 'success', title: 'Note updated' });
      } else {
        await createNote.mutateAsync({ projectId: id, data: { content: noteContent } });
        addToast({ type: 'success', title: 'Note added' });
      }
      setShowNoteModal(false);
      setEditingNote(null);
      setNoteContent('');
    } catch {
      addToast({ type: 'error', title: 'Failed to save note' });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!id) return;
    try {
      await deleteNote.mutateAsync({ projectId: id, noteId });
      addToast({ type: 'success', title: 'Note deleted' });
    } catch {
      addToast({ type: 'error', title: 'Failed to delete note' });
    }
  };

  const openSendModal = (type: 'update' | 'deadline') => {
    if (!project) return;
    setSendType(type);
    if (type === 'update') {
      const msg = `Update: "${project.name}" status is ${project.status}. Progress: ${project.progress}%.`;
      setSendPreviewMessage(msg);
    } else {
      const daysLeft = Math.ceil((new Date(project.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const msg = `Reminder: "${project.name}" deadline is in ${daysLeft} days (${formatDate(project.endDate)}). Current progress: ${project.progress}%.`;
      setSendPreviewMessage(msg);
    }
    setShowSendModal(true);
  };

  const handleSendMessage = async () => {
    if (!id) return;
    try {
      if (sendType === 'deadline') {
        await notificationsApi.sendDeadlineReminder(id);
      } else {
        await sendNotification.mutateAsync({ projectId: id, message: sendPreviewMessage });
      }
      addToast({ type: 'success', title: 'Message sent successfully' });
      setShowSendModal(false);
    } catch {
      addToast({ type: 'error', title: 'Failed to send message' });
    }
  };

  if (projectLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <EmptyState
        title="Project not found"
        description="The project you're looking for doesn't exist"
        action={<Button onClick={() => navigate('/projects')}>Back to Projects</Button>}
      />
    );
  }

  const statusConf = STATUS_CONFIG[project.status];
  const displayProgress = progressValue !== null ? progressValue : project.progress;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/projects')}
            className="mt-1 p-2 rounded-lg hover:bg-warm-100 text-text-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-text-primary break-words">{project.name}</h1>
              {statusConf && (
                <Badge variant="status" status={project.status}>{statusConf.label}</Badge>
              )}
            </div>
            <p className="text-sm text-text-secondary">{project.description}</p>
            <div className="flex items-center gap-3 sm:gap-4 mt-2 text-xs text-text-tertiary flex-wrap">
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{project.pmName}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 self-end sm:self-start">
          <Button variant="danger" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={() => setShowDeleteModal(true)}>Delete</Button>
        </div>
      </div>

      {/* Progress Section */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Progress</CardTitle>
          {progressValue !== null && (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setProgressValue(null)}>Cancel</Button>
              <Button size="sm" onClick={handleProgressChange} loading={updateProject.isPending}>Save</Button>
            </div>
          )}
        </CardHeader>
        <div className="space-y-3">
          <ProgressBar value={displayProgress} showLabel />
          <input
            type="range"
            min={0}
            max={100}
            value={displayProgress}
            onChange={(e) => setProgressValue(Number(e.target.value))}
            className="w-full accent-coral h-2"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notes Section */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Notes</CardTitle>
            <Button
              size="sm"
              variant="ghost"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => { setEditingNote(null); setNoteContent(''); setShowNoteModal(true); }}
            >
              Add Note
            </Button>
          </CardHeader>
          {notes.length === 0 ? (
            <EmptyState
              icon={<StickyNote className="w-8 h-8 text-text-tertiary" />}
              title="No notes yet"
              description="Add notes to track project updates"
            />
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {notes.map((note) => (
                <div key={note.id} className="p-3 rounded-lg border border-warm-400 hover:bg-warm-100 transition-colors group">
                  <p className="text-sm text-text-primary whitespace-pre-wrap">{note.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-text-tertiary">
                      {note.authorName} &middot; {formatRelative(note.createdAt)}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingNote(note); setNoteContent(note.content); setShowNoteModal(true); }}
                        className="p-1 rounded text-text-tertiary hover:text-info"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1 rounded text-text-tertiary hover:text-danger"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* WhatsApp Group Card */}
        <Card>
          <CardHeader>
            <CardTitle>WhatsApp Group</CardTitle>
          </CardHeader>
          {hasWAGroup ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{project.waGroupName || 'Connected Group'}</p>
                  <p className="text-xs text-text-secondary">ID: {project.waGroupId}</p>
                </div>
              </div>

              {isWAConnected ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="sm"
                    icon={<Send className="w-4 h-4" />}
                    onClick={() => openSendModal('update')}
                  >
                    Send Update Now
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<Bell className="w-4 h-4" />}
                    onClick={() => openSendModal('deadline')}
                  >
                    Send Deadline Reminder
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  WhatsApp is disconnected. Connect it in Settings to send messages.
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={<Send className="w-8 h-8 text-text-tertiary" />}
              title="No WA group linked"
              description="Link a WhatsApp group to send project updates"
            />
          )}
        </Card>
      </div>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        {activities.length === 0 ? (
          <EmptyState title="No activity yet" description="Activity will appear here as the project is updated" />
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {activities.map((activity) => {
              const config = ACTION_CONFIG[activity.action];
              return (
                <div key={activity.id} className="flex items-start gap-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-coral mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-text-primary">
                      <span className="font-medium">{activity.userName}</span>{' '}
                      <span className="text-text-secondary">{activity.details}</span>
                    </p>
                    <p className="text-xs text-text-tertiary mt-0.5">{formatRelative(activity.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Note Modal */}
      <Modal isOpen={showNoteModal} onClose={() => { setShowNoteModal(false); setEditingNote(null); }} title={editingNote ? 'Edit Note' : 'Add Note'}>
        <div className="space-y-4">
          <Textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Write your note..."
            rows={5}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowNoteModal(false)}>Cancel</Button>
            <Button onClick={handleSaveNote} loading={createNote.isPending || updateNote.isPending}>Save</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Project" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Are you sure you want to delete <span className="font-medium text-text-primary">{project.name}</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleteProject.isPending}>Delete</Button>
          </div>
        </div>
      </Modal>

      {/* Send Message Modal */}
      <Modal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        title={sendType === 'update' ? 'Send Project Update' : 'Send Deadline Reminder'}
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-warm-100 border border-warm-400">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-success" />
              <span className="text-xs font-medium text-text-secondary">
                To: {project.waGroupName || project.waGroupId}
              </span>
            </div>
          </div>
          <Textarea
            label="Message Preview"
            value={sendPreviewMessage}
            onChange={(e) => setSendPreviewMessage(e.target.value)}
            rows={5}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowSendModal(false)}>Cancel</Button>
            <Button
              icon={<Send className="w-4 h-4" />}
              onClick={handleSendMessage}
              loading={sendNotification.isPending}
            >
              Send Message
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
