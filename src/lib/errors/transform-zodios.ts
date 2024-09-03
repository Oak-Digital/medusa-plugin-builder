import { AxiosError } from "axios";
import { UnknownException } from "effect/Cause";
import { HttpError } from "./http";
import { NetworkError } from "./network";

export const transformZodiosError = (error: unknown) => {
    if (!(error instanceof AxiosError)) {
        return new UnknownException(error);
    }

    if (typeof error.status === 'number') {
        return new HttpError(error.status, error);
    }

    if (!error.request || !error.response) {
        // Something might be wrong with the connection
        return new NetworkError(error);
    }

    return error;
}
