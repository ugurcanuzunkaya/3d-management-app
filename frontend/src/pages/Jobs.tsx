import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, X } from 'lucide-react';
import type { Filament, Model3D, PrintJob, PrintJobCreate } from '@/types';
import { JobsSkeleton } from '@/components/ui/Skeleton';
import { PrivacyWrapper } from '@/components/shared/PrivacyWrapper';
import { useJobs } from '@/hooks/use-jobs';
import { useFilaments } from '@/hooks/use-filaments';
import { useSettings } from '@/hooks/use-settings';
import { useModels } from '@/hooks/use-models';
import { JobForm } from '@/components/jobs/JobForm';
import { JobTable } from '@/components/jobs/JobTable';
import { PendingJobsBanner } from '@/components/jobs/PendingJobsBanner';

const buildPrefilledJobFromModel = (model: Model3D, filaments: Filament[]): PrintJob => {
  const targetType = model.tech_details?.filament_type?.toUpperCase();
  const matchedSpool = targetType
    ? filaments.find(f => f.filament_type?.name.toUpperCase() === targetType) ?? filaments[0]
    : filaments[0];

  return {
    id: 0,
    name: model.name,
    job_type: 'Model Library',
    model_id: model.id,
    duration_minutes: model.tech_details?.print_time_minutes || 0,
    total_cost: 0,
    production_cost: 0,
    status: 'completed',
    created_at: new Date().toISOString(),
    job_filaments: [
      {
        filament_id: matchedSpool?.id || 0,
        grams_used: model.estimated_weight_g || 0,
      },
    ],
  };
};

const JobsHeader = ({
  showForm,
  hasJobs,
  isDeletingAll,
  onToggleForm,
  onDeleteAll,
}: {
  showForm: boolean;
  hasJobs: boolean;
  isDeletingAll: boolean;
  onToggleForm: () => void;
  onDeleteAll: () => void;
}) => (
  <div className="flex justify-between items-center">
    <div>
      <h1 className="text-3xl font-bold">
        <PrivacyWrapper keyName="maskJobsTitle" placeholder="•••••" inline>
          Print Jobs
        </PrivacyWrapper>
      </h1>
      <p className="text-muted-foreground">Track and manage your manual and automated print jobs.</p>
    </div>
    <div className="flex gap-2">
      <Button variant="destructive" onClick={onDeleteAll} disabled={!hasJobs || isDeletingAll} className="gap-2">
        <Trash2 className="w-4 h-4" /> Delete All
      </Button>
      <Button onClick={onToggleForm} className="gap-2">
        {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        {showForm ? 'Cancel' : 'Add New Job'}
      </Button>
    </div>
  </div>
);

const Jobs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const modelIdParam = searchParams.get('modelId');
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<PrintJob | null>(null);

  const {
    jobs,
    isLoading: jobsLoading,
    createJob,
    isCreatingJob,
    updateJob,
    isUpdatingJob,
    approveJob,
    deleteJob,
    deleteAllJobs,
    isDeletingAllJobs,
  } = useJobs();
  const { filaments } = useFilaments();
  const { settings } = useSettings();
  const { models } = useModels();

  const sortedFilaments = useMemo(
    () => [...filaments].sort((a, b) => a.name.localeCompare(b.name)),
    [filaments]
  );

  const prefilledFromModel = useMemo(() => {
    if (!modelIdParam) return null;
    const found = models.find(m => String(m.id) === modelIdParam);
    return found ? buildPrefilledJobFromModel(found, sortedFilaments) : null;
  }, [modelIdParam, models, sortedFilaments]);

  const activeInitialData = editingJob ?? prefilledFromModel;
  const isFormVisible = showForm || Boolean(prefilledFromModel);

  const pendingJobs = useMemo(() => jobs.filter(j => j.status === 'pending'), [jobs]);
  const completedJobs = useMemo(() => jobs.filter(j => j.status !== 'pending'), [jobs]);

  const handleCancel = () => {
    setShowForm(false);
    setEditingJob(null);
    if (modelIdParam) setSearchParams({});
  };

  const handleEdit = (job: PrintJob) => {
    setEditingJob(job);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (data: PrintJobCreate) => {
    if (editingJob && editingJob.id > 0) {
      await updateJob({ id: editingJob.id, data: { ...data, status: 'completed' } });
    } else {
      await createJob(data);
    }
    handleCancel();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this job? This will restore the used filament stock.')) {
      await deleteJob(id);
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('WARNING: Are you sure you want to delete ALL jobs? This action cannot be undone and will restore all used filament stock.')) {
      await deleteAllJobs();
    }
  };

  if (jobsLoading) return <JobsSkeleton />;

  return (
    <div className="space-y-8">
      <JobsHeader
        showForm={isFormVisible}
        hasJobs={jobs.length > 0}
        isDeletingAll={isDeletingAllJobs}
        onToggleForm={() => (isFormVisible ? handleCancel() : setShowForm(true))}
        onDeleteAll={handleDeleteAll}
      />

      <PendingJobsBanner
        pendingJobs={pendingJobs}
        filaments={sortedFilaments}
        onApprove={(id, data) => approveJob({ id, data })}
        onReviewEdit={handleEdit}
        onDismiss={id => deleteJob(id)}
      />

      {isFormVisible && (
        <JobForm
          key={editingJob?.id ?? (prefilledFromModel ? `model-${prefilledFromModel.model_id}` : 'new')}
          initialData={activeInitialData}
          filaments={sortedFilaments}
          settings={settings}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isPending={isCreatingJob || isUpdatingJob}
        />
      )}

      <Card className="border-none shadow-md">
        <CardContent className="p-0">
          <JobTable jobs={completedJobs} filaments={sortedFilaments} onEdit={handleEdit} onDelete={handleDelete} />
        </CardContent>
      </Card>
    </div>
  );
};

export default Jobs;
