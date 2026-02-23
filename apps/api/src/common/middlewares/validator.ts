import { ZodError, type ZodRawShape, type ZodObject, type z } from 'zod';
import { errors, type ValidationErrors } from 'rfc9457';
import type { Request, Response, NextFunction } from 'express';

function formatZodIssues(err: ZodError): ValidationErrors {
    const errors: ValidationErrors = {};
    err.issues.forEach((issue) => {
        const field = issue.path.join('.') || 'root';
        errors[field] = [issue.message];
    });
    return errors;
}

/**
 * Generic validation middleware for type-safe Zod parsing
 * @param schema Zod schema
 * @param property "body" | "query" | "params"
 */
export function validate<T extends ZodRawShape, K extends 'body' | 'query' | 'params'>(
    schema: ZodObject<T>,
    property: K,
) {
    type Parsed = z.infer<typeof schema>;

    return (req: Request, _res: Response, next: NextFunction) => {
        try {
            const data = req[property];

            if (property === 'body' && (!data || Object.keys(data).length === 0)) {
                return next(
                    errors.client.validation('Validation failed', {
                        body: ['Request body is empty'],
                    }),
                );
            }

            const parsedData = schema.parse(data);

            switch (property) {
                case 'body':
                    (req as Request & { validatedBody: Parsed }).validatedBody = parsedData;
                    break;
                case 'query':
                    (req as Request & { validatedQuery: Parsed }).validatedQuery = parsedData;
                    break;
                case 'params':
                    (req as Request & { validatedParams: Parsed }).validatedParams = parsedData;
                    break;
            }

            next();
        } catch (err) {
            if (err instanceof ZodError) {
                return next(errors.client.validation('Validation failed', formatZodIssues(err)));
            }

            next(err);
        }
    };
}
