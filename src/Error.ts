export class CameraError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CameraError';
    }
}

export class CameraBusyError extends CameraError {
    constructor(message: string = "Device busy") {
        super(message);
        this.name = "CameraBusyError";
    }
}

export class LiveViewNotStartedError extends CameraError {
    constructor(message: string = "Live View not started") {
        super(message);
        this.name = "LiveViewNotStartedError";
    }
}

export class LiveViewAlreadyStartedError extends CameraError {
    constructor(message: string = "Already started") {
        super(message);
        this.name = "AlreadyStartedError";
    }
}