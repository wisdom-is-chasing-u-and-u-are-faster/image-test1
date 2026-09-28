import { TicketStateMachine, ALL_STATUSES, TicketStatus } from '../../src/domain/state_machine/ticket_state_machine';
import matrix from '../fixtures/transition_matrix.json';

describe('7-State Lifecycle State Machine Matrix Suite (TC-STATE-01)', () => {
  it('allows all valid specified transitions', () => {
    for (const item of matrix.allowed) {
      const isValid = TicketStateMachine.isValidTransition(item.from as TicketStatus, item.to as TicketStatus);
      expect(isValid).toBe(true);
    }
  });

  it('strictly rejects illegal transitions across the 49-state matrix', () => {
    for (const item of matrix.disallowed) {
      const isValid = TicketStateMachine.isValidTransition(item.from as TicketStatus, item.to as TicketStatus);
      expect(isValid).toBe(false);
      expect(() => {
        TicketStateMachine.validateTransition(item.from as TicketStatus, item.to as TicketStatus);
      }).toThrow();
    }
  });

  it('enforces mandatory resolution notes of >= 10 chars when moving to RESOLVED', () => {
    expect(() => {
      TicketStateMachine.validateTransition('IN_PROGRESS', 'RESOLVED', '');
    }).toThrow(/resolution_notes/);

    expect(() => {
      TicketStateMachine.validateTransition('IN_PROGRESS', 'RESOLVED', 'short');
    }).toThrow(/minimum of 10 characters/);

    expect(() => {
      TicketStateMachine.validateTransition('IN_PROGRESS', 'RESOLVED', 'Root cause identified and patch deployed.');
    }).not.toThrow();
  });
});
