import type { Server } from 'node:http';
import { errors } from 'rfc9457';
import logger from './common/logger/logger.js';
import { createApp } from './app.js';
import { env } from './config/env.js';

process.on('uncaughtException', (error: Error) => {
    logger.fatal(errors.server.uncaughtException(error).toJSON(), 'Uncaught Exception');
    logger.flush();
    process.exit(1);
});

let server: Server;
const startServer = () => {
    try {
        server = createApp().listen(env.PORT, () =>
            console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`),
        );
    } catch (error) {
        logger.error(errors.server.db(error).toJSON(), 'Server startup failed');
        logger.flush();
        process.exit(1);
    }
};

startServer();

process.on('unhandledRejection', (reason: unknown) => {
    console.error('UNHANDLED REJECTION!, Shutting down...');

    if (reason instanceof Error) {
        logger.error(errors.server.unhandledRejection(reason).toJSON(), 'Unhandled Rejection');
    } else {
        logger.error(
            errors.server.unhandledRejection(new Error('Non-Error rejection')).toJSON(),
            'Unhandled Rejection',
        );
    }

    if (server) {
        server.close(() => process.exit(1));
    } else {
        process.exit(1);
    }
});

process.on('SIGINT', () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    server.close(() => {
        logger.info('✅ Server closed');
        process.exit(0);
    });
});
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        logger.info('✅ Server closed');
        process.exit(0);
    });
});
