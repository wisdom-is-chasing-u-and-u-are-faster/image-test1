import { BadRequestError, UnprocessableEntityError } from '../../errors/rfc7807.error';

export type TicketStatus =
  | 'SUBMITTED'
  | 'QUEUED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'PENDING_CUSTOMER'
  | 'RESOLVED'
  | 'CLOSED';

export const ALL_STATUSES: TicketStatus[] = [
  'SUBMITTED',
  'QUEUED',
  'ASSIGNED',
  'IN_PROGRESS',
  'PENDING_CUSTOMER',
  'RESOLVED',
  'CLOSED'
];

/**
 * Strict 7-State Lifecycle Transition Graph:
 * - SUBMITTED -> QUEUED, ASSIGNED
 * - QUEUED -> ASSIGNED
 * - ASSIGNED -> IN_PROGRESS, QUEUED
 * - IN_PROGRESS -> PENDING_CUSTOMER, RESOLVED
 * - PENDING_CUSTOMER -> IN_PROGRESS, RESOLVED
 * - RESOLVED -> CLOSED, IN_PROGRESS (reopened)
 * - CLOSED -> (terminal state, no outgoing transitions)
 */
export const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  SUBMITTED: ['QUEUED', 'ASSIGNED'],
  QUEUED: ['ASSIGNED'],
  ASSIGNED: ['IN_PROGRESS', 'QUEUED'],
  IN_PROGRESS: ['PENDING_CUSTOMER', 'RESOLVED'],
  PENDING_CUSTOMER: ['IN_PROGRESS', 'RESOLVED'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: []
};

export class TicketStateMachine {
  public static isValidTransition(from: TicketStatus, to: TicketStatus): boolean {
    const allowed = ALLOWED_TRANSITIONS[from];
    return !!allowed && allowed.includes(to);
  }

  public static validateTransition(
    currentStatus: TicketStatus,
    targetStatus: TicketStatus,
    resolutionNotes?: string
  ): void {
    if (currentStatus === targetStatus) {
      throw new BadRequestError(`Ticket is already in '${currentStatus}' status.`);
    }

    if (!TicketStateMachine.isValidTransition(currentStatus, targetStatus)) {
      throw new BadRequestError(
        `Invalid lifecycle transition: Cannot move ticket from '${currentStatus}' to '${targetStatus}'.`
      );
    }

    if (targetStatus === 'RESOLVED') {
      if (!resolutionNotes || resolutionNotes.trim().length < 10) {
        throw new UnprocessableEntityError(
          "Transitioning to 'RESOLVED' requires 'resolution_notes' with a minimum of 10 characters."
        );
      }
    }
  }
}
