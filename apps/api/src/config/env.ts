import { z } from 'zod';

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
    console.error('Invalid environment variables:');
    parsed.error.issues.forEach((issue) => {
        console.error(` - ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
}

export const env = parsed.data;
