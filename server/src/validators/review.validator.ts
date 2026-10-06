import { z } from 'zod';

export const reviewClaimSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT'], {
    errorMap: () => ({ message: "Action must be either 'APPROVE' or 'REJECT'" }),
  }),
  comment: z.string().max(1000).optional(),
});

export type ReviewClaimInput = z.infer<typeof reviewClaimSchema>;
