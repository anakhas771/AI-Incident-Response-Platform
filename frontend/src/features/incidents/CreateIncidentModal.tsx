import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Sparkles } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../import Button from "../components/ui/button";';
import { useCommandStore } from '../../store/useCommandStore';
import { useIncidentStore } from '../../store/useIncidentStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Category, Severity } from '../../types';
import { mockUsers } from '../../services/mockData';

const incidentSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  category: z.enum(['Infrastructure', 'Security', 'Application', 'Database', 'Network', 'Other']),
  assigned_to_id: z.string().optional(),
});

type IncidentFormData = z.infer<typeof incidentSchema>;

export const CreateIncidentModal: React.FC = () => {
  const { isCreateModalOpen, setCreateModalOpen } = useCommandStore();
  const { addIncident } = useIncidentStore();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IncidentFormData>({
    defaultValues: {
      severity: 'HIGH',
      category: 'Security',
    },
  });

  const onSubmit = (data: IncidentFormData) => {
    if (!user) return;
    setIsSubmitting(true);
    setTimeout(() => {
      const assignedUser = mockUsers.find((u) => u.id === data.assigned_to_id) || null;
      addIncident(
        {
          title: data.title,
          description: data.description,
          severity: data.severity as Severity,
          category: data.category as Category,
          assigned_to: assignedUser,
        },
        user
      );
      setIsSubmitting(false);
      reset();
      setCreateModalOpen(false);
    }, 400);
  };

  return (
    <Modal
      isOpen={isCreateModalOpen}
      onClose={() => setCreateModalOpen(false)}
      title="Report New Incident"
      description="Initiate automated AI triage and dispatch alert across security channels."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
            Incident Title *
          </label>
          <input
            {...register('title', { required: 'Title is required' })}
            placeholder="e.g. Kubernetes Cluster Auth API Latency Anomaly"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
          {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Severity Level *
            </label>
            <select
              {...register('severity')}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="CRITICAL">P0 - CRITICAL (System Down)</option>
              <option value="HIGH">P1 - HIGH (Feature Degraded)</option>
              <option value="MEDIUM">P2 - MEDIUM (Performance Anomaly)</option>
              <option value="LOW">P3 - LOW (Minor Warning)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Category *
            </label>
            <select
              {...register('category')}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="Security">Security & Access</option>
              <option value="Infrastructure">Infrastructure & K8s</option>
              <option value="Application">Application Services</option>
              <option value="Database">Database & Storage</option>
              <option value="Network">Network & BGP</option>
              <option value="Other">Other Anomaly</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
            Initial Assignee
          </label>
          <select
            {...register('assigned_to_id')}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
          >
            <option value="">Unassigned (Queue Pool)</option>
            {mockUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} ({u.role})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
            Detailed Description & Telemetry *
          </label>
          <textarea
            {...register('description', { required: 'Description is required' })}
            rows={4}
            placeholder="Include observed behavior, stack traces, cloud provider region, and log snippets..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono text-xs"
          />
          {errors.description && (
            <p className="text-xs text-red-400 mt-1">{errors.description.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Triage Engine automatically assigned on creation</span>
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
