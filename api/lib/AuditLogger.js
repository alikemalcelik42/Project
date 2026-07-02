const AuditLogs = require("../db/models/AuditLogs");
const Enums = require("../config/Enum")

let instance = null;
class AuditLogger {
    constructor() {
        if(!instance) {
            instance = 1;
        }
        return instance;
    }

    info(email, location, proc_type, log) {
        this.#saveToDb({
            level: Enums.LOG_LEVELS.INFO,
            email: email,
            location: location,
            proc_type: proc_type,
            log: log
        });
    }

    warn(email, location, proc_type, log) {
        this.#saveToDb({
            level: Enums.LOG_LEVELS.WARN,
            email: email,
            location: location,
            proc_type: proc_type,
            log: log
        })
    }

    error(email, location, proc_type, log) {
        this.#saveToDb({
            level: Enums.LOG_LEVELS.ERROR,
            email: email,
            location: location,
            proc_type: proc_type,
            log: log
        })
    }

    debug(email, location, proc_type, log) {
        this.#saveToDb({
            level: Enums.LOG_LEVELS.DEBUG,
            email: email,
            location: location,
            proc_type: proc_type,
            log: log
        })
    }

    verbose(email, location, proc_type, log) {
        this.#saveToDb({
            level: Enums.LOG_LEVELS.VERBOSE,
            email: email,
            location: location,
            proc_type: proc_type,
            log: log
        })
    }

    http(email, location, proc_type, log) {
        this.#saveToDb({
            level: Enums.LOG_LEVELS.HTTP,
            email: email,
            location: location,
            proc_type: proc_type,
            log: log
        })
    }

    #saveToDb(level, email, location, proc_type, log) {
        AuditLogs.create({
            level,
            email,
            location,
            proc_type,
            log
        });
    }
}

module.exports = new AuditLogger();