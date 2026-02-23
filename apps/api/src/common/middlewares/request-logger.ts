import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import logger from '../logger/logger.js';

interface RequestLoggerOptions {
    logBody?: boolean;
    logHeaders?: boolean;
    logQuery?: boolean;
}

type LogLevel = 'info' | 'warn' | 'error';

type SendFn = (body?: unknown) => Response;

export function requestLogger(options: RequestLoggerOptions = {}) {
    const { logBody = false, logHeaders = false, logQuery = true } = options;

    return (req: Request, res: Response, next: NextFunction) => {
        const start = Date.now();
        const child = logger.child({ reqId: req.headers['x-request-id'] ?? crypto.randomUUID() });

        const incoming: Record<string, unknown> = {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
        };
        if (logBody && req.body) incoming.body = req.body as unknown;
        if (logHeaders) incoming.headers = req.headers;
        if (logQuery && Object.keys(req.query).length) incoming.query = req.query;

        child.info(incoming, '→ incoming request');

        const finish = (statusCode: number) => {
            const level: LogLevel =
                statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

            const duration = Date.now() - start;
            child[level](
                { method: req.method, url: req.originalUrl, statusCode, duration },
                '← response sent',
            );
        };

        const wrapSend = (original: SendFn): SendFn =>
            function (this: Response, body?: unknown) {
                finish(res.statusCode);
                res.send = original;
                return original.call(this, body);
            };

        res.json = wrapSend(res.json.bind(res) as SendFn);
        res.send = wrapSend(res.send.bind(res) as SendFn);

        next();
    };
}
