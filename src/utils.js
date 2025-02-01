export function getErrorMessage(error) {
    let errorMessage = 'An unknown error occurred';

    if (error?.error?.reason) {
        let reason = error.error.reason;
        reason = reason.split(': ').pop();
        errorMessage = `${error.error.code} - ${reason}`;
    }

    return errorMessage;
}
