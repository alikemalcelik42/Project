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
            email, location, proc_type, log
        })
    }

    warn(email, location, proc_type, log) {
        this.#saveToDb({
            level: Enums.LOG_LEVELS.WARN,
            email, location, proc_type, log
        })
    }

    error(email, location, proc_type, log) {
        this.#saveToDb({
            level: Enums.LOG_LEVELS.ERROR,
            email, location, proc_type, log
        })
    }

    debug(email, location, proc_type, log) {
        this.#saveToDb({
            level: Enums.LOG_LEVELS.DEBUG,
            email, location, proc_type, log
        })
    }

    verbose(email, location, proc_type, log) {
        this.#saveToDb({
            level: Enums.LOG_LEVELS.VERBOSE,
            email, location, proc_type, log
        })
    }

    http(email, location, proc_type, log) {
        this.#saveToDb({
            level: Enums.LOG_LEVELS.HTTP,
            email, location, proc_type, log
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

module.exports = AuditLogger;