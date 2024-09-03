import { AxiosError } from "axios";

export class HttpError<T extends AxiosError | undefined = undefined> {
    public readonly _tag = 'HttpError';

    constructor(
        public readonly statusCode: number,
        public readonly axiosError: T,
    ) { }
}
