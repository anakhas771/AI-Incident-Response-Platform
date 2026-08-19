import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useCommandStore } from '../../stores/useCommandStore';
import { useAuthStore } from '../../stores/useAuthStore';
import apiClient from '../../api/client';
import { Category, Incident, Severity } from '../../types';
import toast from 'react-hot-toast';

const incidentSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  category: z.enum(['Infrastructure', 'Security', 'Application', 'Database', 'Network', 'Other']),
});

type IncidentFormData = z.infer<typeof incidentSchema>;

export const CreateIncidentModal: React.FC = () => {
  const { isCreateModalOpen, setCreateModalOpen } = useCommandStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IncidentFormData>({
    defaultValues: { severity: 'HIGH', category: 'Security' },
  });

  const onSubmit = async (data: IncidentFormData) => {
    if (!user) {
      toast.error('You must be signed in to create an incident.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post<Incident>('/incidents/', {
        title: data.title.trim(),
        description: data.description.trim(),
        severity: data.severity as Severity,
        category: data.category as Category,
        status: 'OPEN',
      });

      const incident = response.data;
      reset();
      setCreateModalOpen(false);
      toast.success(`Incident ${incident.id} created. AI analysis is starting.`);
      navigate(`/incidents/${incident.id}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const detail =
        error?.response?.data?.detail || error?.response?.data || 'Unable to create incident.';
      toast.error(
        typeof detail === 'string'
          ? detail
          : 'Unable to create incident. Check the form and your organization access.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isCreateModalOpen}
      onClose={() => setCreateModalOpen(false)}
      title="Report New Incident"
      description="Create a real incident record. The AI engine will analyze the submitted details after creation."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Incident Title *
          </label>
          <input
            {...register('title')}
            placeholder="Describe the incident clearly"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
          />
          {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Severity Level *
            </label>
            <select
              {...register('severity')}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
            >
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Category *
            </label>
            <select
              {...register('category')}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
            >
              <option value="Security">Security</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Application">Application</option>
              <option value="Database">Database</option>
              <option value="Network">Network</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Detailed Description & Telemetry *
          </label>
          <textarea
            {...register('description')}
            rows={6}
            placeholder="Include observed behavior, timestamps, affected services, errors, logs, user impact, or other evidence."
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-400">{errors.description.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI analysis is generated from this incident's actual data</span>
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="ai" isLoading={isSubmitting}>
              Create Incident
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
