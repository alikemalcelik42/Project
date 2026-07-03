const { EventEmitter } = require("events")

let instance = null;
class Emitter {
    constructor() {
        if(!instance) {
            this.emitters = {};
            instance = this;
        }
    }

    getEmitter(name) {
        return this.emitters[name];
    }

    addEmitter(name) {
        this.emitters[name] = new EventEmitter(name);
        return this.emitters[name];
    }
}

module.exports = new Emitter();