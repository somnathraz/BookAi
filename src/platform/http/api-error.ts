export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly expose = true
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const apiErrors = {
  badRequest: (message = "Invalid request.") => new ApiError(400, "bad_request", message),
  unauthorized: (message = "Authentication required.") => new ApiError(401, "unauthorized", message),
  forbidden: (message = "You don't have access to this resource.") => new ApiError(403, "forbidden", message),
  notFound: (message = "Resource not found.") => new ApiError(404, "not_found", message),
  conflict: (message = "This resource already exists.") => new ApiError(409, "conflict", message),
};

