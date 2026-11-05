export class AppError extends Error {
    statusCode;
    expose;
    constructor(statusCode, message, expose = true) {
        super(message);
        this.statusCode = statusCode;
        this.expose = expose;
        this.name = 'AppError';
    }
}
export const notFound = (message) => new AppError(404, message);
export const badRequest = (message) => new AppError(400, message);
