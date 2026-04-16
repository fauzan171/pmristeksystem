import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Input';
import { Textarea } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { useProjects, useCreateProject, useUpdateProject } from '../hooks/useProjects';
import { formatDate, daysUntil } from '../utils/format';
import { STATUS_CONFIG } from '../utils/constants';
import type { ProjectStatus, CreateProjectRequest, UpdateProjectRequest, Project } from '../types';

const STATUS_TABS: { label: string; value: ProjectStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Ongoing', value: 'ongoing' },
  { label: 'Planning', value: 'planning' },
  { label: 'On Hold', value: 'on-hold' },
  { label: 'Completed', value: 'completed' },
];

export function ProjectsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const limit = 12;

  // Check for ?action=new
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setEditingProject(null);
      setShowModal(true);
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useProjects({
    page,
    limit,
    search: debouncedSearch || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const handleCreateEdit = async (formData: CreateProjectRequest | UpdateProjectRequest) => {
    try {
      if (editingProject) {
        await updateProject.mutateAsync({ id: editingProject.id, data: formData as UpdateProjectRequest });
        addToast({ type: 'success', title: 'Project updated' });
      } else {
        await createProject.mutateAsync(formData as CreateProjectRequest);
        addToast({ type: 'success', title: 'Project created' });
      }
      setShowModal(false);
      setEditingProject(null);
    } catch {
      addToast({ type: 'error', title: 'Failed to save project' });
    }
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setShowModal(true);
  };

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => { setEditingProject(null); setShowModal(true); }}>
          New Project
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === tab.value
                ? 'bg-coral text-white'
                : 'bg-white border border-warm-400 text-text-secondary hover:bg-warm-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Project Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !data?.data?.length ? (
        <EmptyState
          title="No projects found"
          description={search ? 'Try adjusting your search' : 'Create your first project to get started'}
          action={
            !search ? (
              <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
                Create Project
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.data.map((project) => {
              const days = daysUntil(project.endDate);
              const statusConf = STATUS_CONFIG[project.status];
              return (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:shadow-md transition-shadow group"
                  padding={false}
                >
                  <div
                    className="p-5"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-sm font-semibold text-text-primary line-clamp-1 flex-1 mr-2">
                        {project.name}
                      </h3>
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(project); }}
                        className="opacity-0 group-hover:opacity-100 text-xs text-coral hover:text-coral-hover transition-all"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-2 mb-3">
                      {project.description}
                    </p>
                    <div className="flex items-center gap-2 mb-3">
                      {statusConf && (
                        <Badge variant="status" status={project.status}>
                          {statusConf.label}
                        </Badge>
                      )}
                      <span className="text-xs text-text-tertiary">
                        Due {formatDate(project.endDate)}
                      </span>
                    </div>
                    <ProgressBar value={project.progress} size="sm" />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-text-tertiary">{project.progress}%</span>
                      {days < 0 ? (
                        <span className="text-xs text-danger font-medium">{Math.abs(days)}d overdue</span>
                      ) : days <= 7 ? (
                        <span className="text-xs text-warning font-medium">{days}d left</span>
                      ) : (
                        <span className="text-xs text-text-tertiary">{days}d left</span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                icon={<ChevronLeft className="w-4 h-4" />}
              >
                Prev
              </Button>
              <span className="text-sm text-text-secondary">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      <ProjectFormModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingProject(null); }}
        onSubmit={handleCreateEdit}
        project={editingProject}
        loading={createProject.isPending || updateProject.isPending}
      />
    </div>
  );
}

/* ---------- Project Form Modal ---------- */

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProjectRequest | UpdateProjectRequest) => void;
  project: Project | null;
  loading: boolean;
}

function ProjectFormModal({ isOpen, onClose, onSubmit, project, loading }: ProjectFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('planning');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [waGroupId, setWaGroupId] = useState('');
  const [waGroupName, setWaGroupName] = useState('');

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description);
      setStatus(project.status);
      setStartDate(project.startDate?.split('T')[0] || '');
      setEndDate(project.endDate?.split('T')[0] || '');
      setWaGroupId(project.waGroupId || '');
      setWaGroupName(project.waGroupName || '');
    } else {
      setName('');
      setDescription('');
      setStatus('planning');
      setStartDate('');
      setEndDate('');
      setWaGroupId('');
      setWaGroupName('');
    }
  }, [project, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate) return;
    onSubmit({
      name,
      description,
      status,
      startDate,
      endDate,
      waGroupId: waGroupId || undefined,
      waGroupName: waGroupName || undefined,
    });
  };

  const statusOptions = [
    { value: 'planning', label: 'Planning' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'on-hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={project ? 'Edit Project' : 'New Project'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Project Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)} options={statusOptions} />
          <div />
          <Input label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          <Input label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </div>
        <Input label="WhatsApp Group ID (optional)" value={waGroupId} onChange={(e) => setWaGroupId(e.target.value)} />
        <Input label="WhatsApp Group Name (optional)" value={waGroupName} onChange={(e) => setWaGroupName(e.target.value)} />
        <div className="flex justify-end gap-3 pt-4 border-t border-warm-400">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{project ? 'Update' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}
