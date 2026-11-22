// src/lib/ApiError.ts
export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export class ApiError extends Error {
  status: number;
  details?: ValidationErrorDetail[];
  code?: string;

  constructor(
    message: string,
    status: number,
    details?: ValidationErrorDetail[],
    code?: string
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.code = code;
  }
}
