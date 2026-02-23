import express, { type Application } from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { StatusCodes } from 'http-status-codes';
import { requestLogger } from './common/middlewares/request-logger.js';
import { errorResponder, notFoundResponder } from './common/middlewares/errors.js';

export function createApp(): Application {
    const app: Application = express();

    if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
    app.disable('x-powered-by');

    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(
        cors({
            origin: process.env.CLIENT_URL,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: true,
        }),
    );
    app.use(
        rateLimit({
            message: 'Too many requests, please try again later',
            windowMs: 15 * 60 * 1000,
            limit: 100,
            standardHeaders: 'draft-8',
            legacyHeaders: false,
            ipv6Subnet: 56,
        }),
    );
    app.use(helmet());
    app.use(compression());
    app.use(cookieParser());

    app.get('/health', (_req, res) => res.sendStatus(StatusCodes.OK));

    app.use(requestLogger);
    app.use(notFoundResponder);
    app.use(errorResponder);

    return app;
}
