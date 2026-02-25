import type { ZodError } from 'zod';
import type { ValidationErrors } from 'rfc9457';

export function formatZodIssues(err: ZodError): ValidationErrors {
    const errors: ValidationErrors = {};
    err.issues.forEach((issue) => {
        const field = issue.path.join('.') || 'root';
        errors[field] = [issue.message];
    });
    return errors;
}
