import process from 'process';
import fs from 'fs';
import path from 'path';

export function getErrorMessage(error) {
    let errorMessage = 'An unknown error occurred';

    if (error?.error?.reason) {
        let reason = error.error.reason;
        reason = reason.split(': ').pop();
        errorMessage = `${error.error.code} - ${reason}`;
    }

    return errorMessage;
}

export function getJsonABI(toPath = '') {
    const cwd = process.cwd();
    const filePath = path.resolve(cwd, `artifacts/contracts/${toPath}`);
    const fileContent = fs.readFileSync(filePath, 'utf8');

    return JSON.parse(fileContent);
}
