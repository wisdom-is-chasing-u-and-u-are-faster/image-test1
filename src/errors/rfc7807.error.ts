export interface ProblemDetailsPayload {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  [key: string]: any;
}

export class AppError extends Error {
  public readonly status: number;
  public readonly type: string;
  public readonly title: string;
  public readonly detail: string;
  public readonly extra?: Record<string, any>;

  constructor(status: number, title: string, detail: string, type = 'about:blank', extra?: Record<string, any>) {
    super(detail);
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.type = type;
    this.extra = extra;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toProblemDetails(instance?: string): ProblemDetailsPayload {
    return {
      type: this.type,
      title: this.title,
      status: this.status,
      detail: this.detail,
      instance,
      ...this.extra
    };
  }
}

export class BadRequestError extends AppError {
  constructor(detail: string, extra?: Record<string, any>) {
    super(400, 'Bad Request', detail, 'https://errors.etms.corp/bad-request', extra);
  }
}

export class UnauthorizedError extends AppError {
  constructor(detail = 'Authentication credentials missing or invalid.') {
    super(401, 'Unauthorized', detail, 'https://errors.etms.corp/unauthorized');
  }
}

export class ForbiddenError extends AppError {
  constructor(detail = 'Insufficient permissions to perform this operation.') {
    super(403, 'Forbidden', detail, 'https://errors.etms.corp/forbidden');
  }
}

export class NotFoundError extends AppError {
  constructor(detail = 'The requested resource was not found.') {
    super(404, 'Not Found', detail, 'https://errors.etms.corp/not-found');
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(detail: string) {
    super(422, 'Unprocessable Entity', detail, 'https://errors.etms.corp/unprocessable-entity');
  }
}
