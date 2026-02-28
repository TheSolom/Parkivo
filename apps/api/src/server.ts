import type { Server } from 'node:http';
import { errors } from 'rfc9457';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import logger from './common/logger/logger.js';
import { createApp } from './app.js';

let server: Server | undefined;
let isShuttingDown = false;

const gracefulShutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(`${signal} received. Starting graceful shutdown...`);

    try {
        if (server) {
            await new Promise<void>((resolve, reject) => {
                server!.close((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            logger.info('HTTP server closed');
        }

        await prisma.$disconnect();
        logger.info('Prisma disconnected');

        logger.flush();
        process.exit(0);
    } catch (error) {
        logger.fatal(error, 'Error during shutdown');
        logger.flush();
        process.exit(1);
    }
};

const handleFatalError = async (
    error: unknown,
    type: 'uncaughtException' | 'unhandledRejection',
) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    const err = error instanceof Error ? error : new Error('Unknown fatal error');

    logger.fatal(errors.server[type](err).toJSON(), `Fatal: ${type}`);

    try {
        if (server) {
            await new Promise<void>((resolve) => server!.close(() => resolve()));
        }

        await prisma.$disconnect();
    } catch (shutdownError) {
        logger.fatal(shutdownError, 'Shutdown after fatal error failed');
    }

    logger.flush();
    process.exit(1);
};

const startServer = async () => {
    await prisma.$connect();
    try {
        logger.info('Prisma connected');

        server = createApp().listen(env.PORT, () => {
            logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
        });
    } catch (error) {
        logger.fatal(errors.server.db(error).toJSON(), 'Server startup failed');
        logger.flush();
        await prisma.$disconnect();
        process.exit(1);
    }
};

void startServer();

process.on('SIGINT', () => void gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
process.on('uncaughtException', (error) => void handleFatalError(error, 'uncaughtException'));
process.on('unhandledRejection', (reason) => void handleFatalError(reason, 'unhandledRejection'));
