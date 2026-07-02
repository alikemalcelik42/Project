const logger = require("./logger");
let instance = null;

class LoggerClass {
    constructor() {
        if(!instance) {
            instance = this;
        }

        return instance;
    }

    #createLogObject(email, location, proc_type, log) {
        return {
            email, location, proc_type, log
        }
    }

    info(email, location, proc_type, log) {
        let logs = this.#createLogObject(email, location, proc_type, log);
        logger.info(logs)
    }

    error(email, location, proc_type, log) {
        let logs = this.#createLogObject(email, location, proc_type, log);
        logger.error(logs)
    }

    warn(email, location, proc_type, log) {
        let logs = this.#createLogObject(email, location, proc_type, log);
        logger.info(logs)
    }

    debug(email, location, proc_type, log) {
        let logs = this.#createLogObject(email, location, proc_type, log);
        logger.debug(logs)
    }

    verbose(email, location, proc_type, log) {
        let logs = this.#createLogObject(email, location, proc_type, log);
        logger.verbose(logs)
    }

    http(email, location, proc_type, log) {
        let logs = this.#createLogObject(email, location, proc_type, log);
        logger.http(logs)
    }

    silly(email, location, proc_type, log) {
        let logs = this.#createLogObject(email, location, proc_type, log);
        logger.silly(logs)
    }

}

module.exports = new LoggerClass();