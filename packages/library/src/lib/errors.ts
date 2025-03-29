export class ABTestingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ABTestingError";
  }
}

export class NetworkError extends ABTestingError {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export class TimeoutError extends ABTestingError {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

export class UnauthorizedError extends ABTestingError {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class UserNotInitializedError extends ABTestingError {
  constructor(message: string) {
    super(message);
    this.name = "UserNotInitializedError";
  }
}
