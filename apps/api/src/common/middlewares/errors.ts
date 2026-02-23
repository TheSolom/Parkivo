import { ZodError } from 'zod';
import { errors, isHttpError, type ValidationErrors } from 'rfc9457';
import type { Request, Response, NextFunction } from 'express';
import type { HttpError } from 'node_modules/rfc9457/dist/core/index.js';
import logger from '../logger/logger.js';

interface ErrorLoggerOptions {
    logClientErrors?: boolean;
    logStack?: boolean;
}

function formatZodIssues(err: ZodError): ValidationErrors {
    const errors: ValidationErrors = {};
    err.issues.forEach((issue) => {
        const field = issue.path.join('.') || 'root';
        errors[field] = [issue.message];
    });
    return errors;
}

function toProblemDetails(err: Error): HttpError {
    if (err instanceof ZodError) {
        return errors.client.validation('Validation failed', formatZodIssues(err));
    }

    return errors.server.internal(err);
}

function isClientError(err: Error): boolean {
    if (err instanceof ZodError) return true;
    if (isHttpError(err)) return err.status >= 400 && err.status < 500;
    return false;
}

export function errorLogger(error: HttpError, req: Request, options: ErrorLoggerOptions = {}) {
    const { logClientErrors = true, logStack = process.env.NODE_ENV !== 'production' } = options;
    const client = isClientError(error);

    const payload = {
        error: error.toJSON(),
        req: { method: req.method, url: req.originalUrl, params: req.params, ip: req.ip },
        ...(logStack && !client && { stack: error.stack }),
    };

    if (client) {
        if (logClientErrors) logger.warn(payload, error.title);
    } else {
        logger.error(payload, error.title);
    }
}

export function notFoundResponder(req: Request, res: Response) {
    const error = errors.client.notFound('Resource not found');
    errorLogger(error, req);
    return res.status(error.status).type('application/problem+json').send(error.toJSON());
}

export function errorResponder(err: Error, req: Request, res: Response, _next: NextFunction) {
    const error = isHttpError(err) ? err : toProblemDetails(err);
    errorLogger(error, req);
    return res.status(error.status).type('application/problem+json').send(error.toJSON());
}
