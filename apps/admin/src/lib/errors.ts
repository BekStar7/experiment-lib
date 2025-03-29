export class ServiceUnavailableError extends Error {
  constructor(message: string = "Сервис недоступен") {
    super(message);
    this.name = "ServiceUnavailableError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = "Вы не авторизованы") {
    super(message);
    this.name = "UnauthorizedError";
  }
}
