// src/utils/OrderError.ts
export class OrderError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);

    this.name = "OrderError";
  }
}
