import { AxiosError } from "axios";

export class NetworkError<T extends AxiosError | undefined = undefined> {
    readonly _tag = "NetworkError";

    constructor(
        public readonly axiosError: T
    ) { }
}
