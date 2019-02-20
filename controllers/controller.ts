import * as FhirHelper from '../fhirHelper';
import * as log4js from 'log4js';

export class BaseController {
    protected static log = log4js.getLogger();

    protected static handleError(err, body?, res?, defaultMessage = 'An unknown error occurred') {
        const msg = FhirHelper.getErrorString(err, body, defaultMessage);

        this.log.error(msg);

        if (res) {
            if (err && err.statusCode) {
                res.status(err.statusCode);
            } else {
                res.status(500);
            }

            res.send(msg);
        }
    }
}