const xlsx = require("node-xlsx");

class Export {
    constructor() {

    }

    /**
     * 
     * @param {Array} titles Excel tablosunun başlıkları 
     * @param {Array} columns Excel tablosuna yazılcak verilerin isimler
     * @param {Array} data Excel tablosuna yazılcak veri
     */
    toExcel(titles, columns, data) {
        let rows = [];
        rows.push(titles);

        for(let d of data) {
            let cols = [];
            for(let c of columns) {
                cols.push(d[c]);
            }
            rows.push(cols);
        }

        xlsx.build([{name: "Sheet", data: rows}]);
    }
}

module.exports = Export;