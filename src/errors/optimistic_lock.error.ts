import { AppError } from './rfc7807.error';

export class OptimisticLockConflictError extends AppError {
  constructor(expectedVersion: number, currentVersion: number, currentRecord?: any) {
    super(
      409,
      'Conflict',
      `Optimistic lock failure: Record was modified by another transaction. Expected version ${expectedVersion}, but found ${currentVersion}.`,
      'https://errors.etms.corp/concurrency-conflict',
      {
        error_code: 'ERR_CONCURRENCY_CONFLICT',
        expected_version: expectedVersion,
        current_version: currentVersion,
        current_record: currentRecord
      }
    );
  }
}
