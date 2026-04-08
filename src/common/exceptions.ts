export class AppError extends Error {
  statusCode: number;
  type: string;
  title: string;

  constructor(
    message: string,
    statusCode: number,
    title: string,
    type: string,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.title = title;
    this.type = type;
  }

  toRFC7807(instance?: string) {
    return {
      type: this.type,
      title: this.title,
      status: this.statusCode,
      detail: this.message,
      ...(instance && { instance }),
    };
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Requête invalide") {
    super(message, 400, "Bad Request", "urn:app:error:bad-request");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Non authentifié") {
    super(message, 401, "Unauthorized", "urn:app:error:unauthorized");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Accès interdit") {
    super(message, 403, "Forbidden", "urn:app:error:forbidden");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Ressource introuvable") {
    super(message, 404, "Not Found", "urn:app:error:not-found");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflit") {
    super(message, 409, "Conflict", "urn:app:error:conflict");
  }
}
