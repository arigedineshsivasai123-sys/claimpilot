import React from 'react';
import { Badge } from '../common/Badge';
import { ClaimStatus, Recommendation } from '../../types';

interface ClaimStatusBadgeProps {
  status: ClaimStatus;
  recommendation?: Recommendation | null;
  size?: 'sm' | 'md';
}

export const ClaimStatusBadge: React.FC<ClaimStatusBadgeProps> = ({
  status,
  recommendation,
  size = 'md',
}) => {
  // If status is finalized, show recommendation color
  if (status === 'APPROVED' || recommendation === 'APPROVE') {
    return (
      <Badge variant="success" size={size} dot>
        APPROVED
      </Badge>
    );
  }

  if (status === 'REJECTED' || recommendation === 'REJECT') {
    return (
      <Badge variant="danger" size={size} dot>
        REJECTED
      </Badge>
    );
  }

  if (status === 'ESCALATED' || recommendation === 'ESCALATE') {
    return (
      <Badge variant="warning" size={size} dot>
        ESCALATED
      </Badge>
    );
  }

  if (status === 'PROCESSING') {
    return (
      <Badge variant="info" size={size} dot>
        AI PROCESSING
      </Badge>
    );
  }

  if (status === 'UPLOADED') {
    return (
      <Badge variant="purple" size={size}>
        DOCS READY
      </Badge>
    );
  }

  if (status === 'UNDER_REVIEW') {
    return (
      <Badge variant="warning" size={size} dot>
        UNDER REVIEW
      </Badge>
    );
  }

  if (status === 'FAILED') {
    return (
      <Badge variant="danger" size={size}>
        FAILED
      </Badge>
    );
  }

  return (
    <Badge variant="neutral" size={size}>
      DRAFT
    </Badge>
  );
};
