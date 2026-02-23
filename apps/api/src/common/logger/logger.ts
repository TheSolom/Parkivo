import pino, { type Logger } from 'pino';
import path from 'node:path';
import fs from 'node:fs';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const logsDir = path.resolve(process.cwd(), 'logs');

if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

let logger: Logger;

if (IS_PRODUCTION) {
    const transport = pino.transport({
        target: 'pino/file',
        options: { destination: path.join(logsDir, 'app.log') },
    });
    logger = pino(
        {
            level: 'info',
            base: { service: 'api' },
            redact: ['req.headers.authorization', 'req.body.password', 'req.body.token'],
        },
        transport,
    );
} else {
    const transport = pino.transport({
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
            singleLine: true,
        },
    });
    logger = pino(
        {
            level: 'debug',
            base: { service: 'api' },
            redact: ['req.headers.authorization', 'req.body.password', 'req.body.token'],
        },
        transport,
    );
}

export default logger;
