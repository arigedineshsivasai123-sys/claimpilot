import { z } from 'zod';

export const createClaimSchema = z.object({
  claimNumber: z.string().optional(),
  patientName: z.string().optional(),
  hospital: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  claimAmount: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  isDemo: z.boolean().optional(),
  demoType: z.enum(['valid', 'exclusion', 'inconsistency', 'suspicious']).optional(),
});

export const updateClaimSchema = z.object({
  patientName: z.string().optional(),
  hospital: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  claimAmount: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});

export type CreateClaimInput = z.infer<typeof createClaimSchema>;
export type UpdateClaimInput = z.infer<typeof updateClaimSchema>;
