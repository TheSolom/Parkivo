import { z } from 'zod';
import { error } from 'rfc9457';
import logger from '../common/logger/logger.js';
import { formatZodIssues } from '../common/utils/zod.js';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production'], {
        message: 'NODE_ENV must be one of: development, production',
    }),
    PORT: z
        .string({
            message: 'PORT is required',
        })
        .transform(Number),
    CLIENT_URL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    logger.error(
        error.envInvalid(formatZodIssues(parsed.error)).toJSON(),
        'Invalid environment variables',
    );
    logger.flush();
    process.exit(1);
}

export const env = parsed.data;
