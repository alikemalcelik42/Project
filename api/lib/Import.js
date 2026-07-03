const xlsx = require("node-xlsx");
const CustomError = require('./Error');
const {HTTP_CODES} = require('../config/Enum');

class Import {
    constructor() {

    }

    fromExcel(filePath) {
        let workSheets = xlsx.parse(filePath);
        if(!workSheets || workSheets.length <= 0) {
            throw new CustomError(HTTP_CODES.BAD_REQUEST, "Invalid Excel Format", "Excel format is invalid");
        }

        let rows = workSheets[0].data;
        
        if(!rows || rows.length <= 0) {
            throw new CustomError(HTTP_CODES.BAD_REQUEST, "Excel File Empty", "Excel File is empty");
        }

        return rows;
    }

}

module.exports = Import;