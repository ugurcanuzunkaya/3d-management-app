import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ClipboardList, Package, Calculator, Edit, X } from 'lucide-react';
import api from '@/lib/api';
import type { PrintJob, Filament, JobFilament, Settings } from '@/types';
import { format } from 'date-fns';
import { JobsSkeleton } from '@/components/ui/Skeleton';
import { PrivacyWrapper } from '@/components/shared/PrivacyWrapper';

const Jobs = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    job_type: 'Generic',
    duration_minutes: 0,
    total_cost: 0,
    production_cost: 0,
    filaments: [{ filament_id: 0, grams_used: 0 }] as JobFilament[]
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery<PrintJob[]>({
    queryKey: ['jobs'],
    queryFn: () => api.get('/api/printjobs').then(res => res.data)
  });

  const { data: filaments } = useQuery<Filament[]>({
    queryKey: ['filaments'],
    queryFn: () => api.get('/api/filaments').then(res => res.data.sort((a: Filament, b: Filament) => a.name.localeCompare(b.name)))
  });

  const { data: settings } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: () => api.get('/api/settings').then(res => res.data)
  });

  // Calculate production cost automatically
  const productionCost = useMemo(() => {
    let totalFilamentCost = 0;
    formData.filaments.forEach(jf => {
      const filament = filaments?.find(f => f.id === jf.filament_id);
      if (filament && jf.grams_used > 0) {
        totalFilamentCost += (filament.price_per_kg / 1000) * jf.grams_used;
      }
    });

    const electricPricePerMin = (settings?.electric_price || 0) * ((settings?.fallback_wattage || 200) / 1000) / 60;
    const electricCost = formData.duration_minutes * electricPricePerMin;

    return totalFilamentCost + electricCost;
  }, [formData.filaments, formData.duration_minutes, filaments, settings]);

  // Default sales price to production cost if it's currently 0
  useEffect(() => {
    if (formData.total_cost === 0 && productionCost > 0) {
      const timer = setTimeout(() => {
        setFormData(prev => {
          if (prev.total_cost === 0) {
            return { ...prev, total_cost: parseFloat(productionCost.toFixed(2)) };
          }
          return prev;
        });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [productionCost, formData.total_cost]);

  const upsertMutation = useMutation({
    mutationFn: (newJob: Partial<PrintJob>) => {
      if (editingJobId) {
        return api.put(`/api/printjobs/${editingJobId}`, newJob);
      }
      return api.post('/api/printjobs', newJob);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['filaments'] });
      handleCancel();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/printjobs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['filaments'] });
    }
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => api.delete('/api/printjobs/all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['filaments'] });
    }
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this job? This will restore the used filament stock.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleDeleteAll = () => {
    if (window.confirm('WARNING: Are you sure you want to delete ALL jobs? This action cannot be undone and will restore all used filament stock.')) {
      deleteAllMutation.mutate();
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingJobId(null);
    setFormData({
      name: '',
      job_type: 'Generic',
      duration_minutes: 0,
      total_cost: 0,
      production_cost: 0,
      filaments: [{ filament_id: 0, grams_used: 0 }]
    });
  };

  const handleEdit = (job: PrintJob) => {
    try {
      if (!job) return;

      console.log('Editing job:', job);
      setEditingJobId(job.id);

      // Safer mapping of filaments
      const mappedFilaments = job.filaments?.map((f: Filament) => {
        // Find the weight used from the job_filaments link
        const weightLink = job.job_filaments?.find((jf: JobFilament) => jf.filament_id === f.id);
        return {
          filament_id: f.id,
          grams_used: weightLink ? weightLink.grams_used : 0
        };
      }) || [];

      setFormData({
        name: job.name || '',
        job_type: job.job_type || 'Generic',
        duration_minutes: job.duration_minutes || 0,
        total_cost: job.total_cost || 0,
        production_cost: job.production_cost || 0,
        filaments: mappedFilaments.length > 0 ? mappedFilaments : [{ filament_id: 0, grams_used: 0 }]
      });

      setShowForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error in handleEdit:', error);
      alert('Failed to open edit form. Check console for details.');
    }
  };

  const addFilamentLine = () => {
    setFormData({
      ...formData,
      filaments: [...formData.filaments, { filament_id: 0, grams_used: 0 }]
    });
  };

  const removeFilamentLine = (index: number) => {
    const newFilaments = formData.filaments.filter((_, i) => i !== index);
    setFormData({ ...formData, filaments: newFilaments });
  };

  const updateFilament = (index: number, field: keyof JobFilament, value: number) => {
    const newFilaments = [...formData.filaments];
    newFilaments[index] = { ...newFilaments[index], [field]: value };
    setFormData({ ...formData, filaments: newFilaments });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validFilaments = formData.filaments.filter(f => f.filament_id > 0 && f.grams_used > 0);
    upsertMutation.mutate({
      ...formData,
      production_cost: productionCost,
      filaments: validFilaments
    } as Partial<PrintJob> & { filaments: JobFilament[] });
  };

  if (jobsLoading) return <JobsSkeleton />;

  return (
    <div className="space-y-8">
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
          <Button variant="destructive" onClick={handleDeleteAll} disabled={!jobs?.length || deleteAllMutation.isPending} className="gap-2">
            <Trash2 className="w-4 h-4" />
            Delete All
          </Button>
          <Button onClick={() => showForm ? handleCancel() : setShowForm(true)} className="gap-2">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'Add New Job'}
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="border-none shadow-xl bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-950">
          <CardHeader>
            <CardTitle>{editingJobId ? 'Edit Job' : 'Create New Job'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Job Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Desk Organizer v2"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Input
                    id="type"
                    placeholder="e.g. Prototype"
                    value={formData.job_type}
                    onChange={e => setFormData({ ...formData, job_type: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Total Time (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={e => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Estimated Sales Price (TL)</Label>
                  <Input
                    id="price"
                    type="number" step="0.01"
                    value={formData.total_cost}
                    onChange={e => setFormData({ ...formData, total_cost: parseFloat(e.target.value) || 0 })}
                  />
                  <div className="mt-2 flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                    <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Calculated Production Cost</p>
                      <p className="text-2xl font-black text-blue-700 dark:text-blue-300">
                        <PrivacyWrapper keyName="maskJobProductionCost" placeholder="•••.••" inline>
                          ₺{productionCost.toFixed(2)}
                        </PrivacyWrapper>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-bold">Filaments Used</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addFilamentLine} className="gap-2">
                    <Plus className="w-3 h-3" /> Add Filament
                  </Button>
                </div>
                {formData.filaments.map((line, index) => (
                  <div key={index} className="flex gap-4 items-end bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex-1 space-y-2">
                      <Label>Filament</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={line.filament_id}
                        onChange={e => updateFilament(index, 'filament_id', parseInt(e.target.value))}
                        required
                      >
                        <option value="0">Select Filament...</option>
                        {filaments?.map(f => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.remaining_weight_g}g left)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32 space-y-2">
                      <Label>Weight (g)</Label>
                      <Input
                        type="number"
                        value={line.grams_used}
                        onChange={e => updateFilament(index, 'grams_used', parseFloat(e.target.value))}
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFilamentLine(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      disabled={formData.filaments.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={upsertMutation.isPending}>
                  {upsertMutation.isPending ? 'Saving Job...' : (editingJobId ? 'Update Job' : 'Save Job & Update Stock')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <PrivacyWrapper keyName="maskJobDate" inline>Date</PrivacyWrapper>
                </TableHead>
                <TableHead>
                  <PrivacyWrapper keyName="maskJobName" inline>Job Name</PrivacyWrapper>
                </TableHead>
                <TableHead>
                  <PrivacyWrapper keyName="maskJobType" inline>Type</PrivacyWrapper>
                </TableHead>
                <TableHead>
                  <PrivacyWrapper keyName="maskJobFilaments" inline>Filaments</PrivacyWrapper>
                </TableHead>
                <TableHead>
                  <PrivacyWrapper keyName="maskJobDuration" inline>Duration</PrivacyWrapper>
                </TableHead>
                <TableHead>
                  <PrivacyWrapper keyName="maskJobTotalCost" inline>Price</PrivacyWrapper> / <PrivacyWrapper keyName="maskJobProductionCost" inline>Prod.</PrivacyWrapper> / <PrivacyWrapper keyName="maskJobProfit" inline>Profit</PrivacyWrapper>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <ClipboardList className="w-12 h-12 opacity-20" />
                      <p>No jobs found. Start by adding your first print job!</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {jobs?.map((job) => (
                <TableRow key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                  <TableCell className="font-medium font-mono text-xs">
                    <PrivacyWrapper keyName="maskJobDate" placeholder="••••••••••••" inline>
                      {format(new Date(job.created_at), 'MMM dd, HH:mm')}
                    </PrivacyWrapper>
                  </TableCell>
                  <TableCell className="font-bold">
                    <PrivacyWrapper keyName="maskJobName" placeholder="••••••••••••" inline>
                      {job.name}
                    </PrivacyWrapper>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase font-mono">
                      <PrivacyWrapper keyName="maskJobType" placeholder="•••••" inline>
                        {job.job_type || 'N/A'}
                      </PrivacyWrapper>
                    </span>
                  </TableCell>
                  <TableCell>
                    <PrivacyWrapper keyName="maskJobFilaments" placeholder="••••••••" inline>
                      <div className="flex flex-wrap gap-1">
                        {job.filaments?.map((f, i) => (
                          <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px]">
                            <Package className="w-3 h-3" />
                            {f.name}
                          </span>
                        ))}
                        {(!job.filaments || job.filaments.length === 0) && '-'}
                      </div>
                    </PrivacyWrapper>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    <PrivacyWrapper keyName="maskJobDuration" placeholder="•••" inline>
                      {job.duration_minutes}m
                    </PrivacyWrapper>
                  </TableCell>
                  <TableCell className="font-mono">
                    <div className="flex flex-col">
                      <span className="font-bold text-green-600 font-mono">
                        <PrivacyWrapper keyName="maskJobTotalCost" placeholder="₺•••.••" inline>
                          ₺{job.total_cost.toFixed(2)}
                        </PrivacyWrapper>
                      </span>
                      <div className="flex gap-2 items-center text-[10px] font-mono">
                        <span className="text-muted-foreground opacity-70">
                          Cost:{' '}
                          <PrivacyWrapper keyName="maskJobProductionCost" placeholder="₺•••.••" inline>
                            ₺{job.production_cost.toFixed(2)}
                          </PrivacyWrapper>
                        </span>
                        <span className="text-blue-600 font-bold">
                          P:{' '}
                          <PrivacyWrapper keyName="maskJobProfit" placeholder="₺•••.••" inline>
                            ₺{(job.total_cost - job.production_cost).toFixed(2)}
                          </PrivacyWrapper>
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(job)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(job.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Jobs;
