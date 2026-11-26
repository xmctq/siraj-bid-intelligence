/** Errors whose message is safe to show to end users. Anything else is reported generically. */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFound = (what = "Resource") => new AppError("not_found", `${what} not found.`, 404);
