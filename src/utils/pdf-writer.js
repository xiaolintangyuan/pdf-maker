'use strict';

const pdfmake = require('pdfmake');
const robotoFonts = require('pdfmake/fonts/Roboto');
const courierFont = require('pdfmake/standard-fonts/Courier');

class PdfWriter {
    static async write(definition, outputPath) {
        pdfmake.setUrlAccessPolicy(function () {
            return false;
        });
        pdfmake.setLocalAccessPolicy(function () {
            return true;
        });
        pdfmake.addFonts(robotoFonts);
        pdfmake.addFonts(courierFont);
        const document = pdfmake.createPdf(definition);
        await document.write(outputPath);
    }
}

module.exports = PdfWriter;