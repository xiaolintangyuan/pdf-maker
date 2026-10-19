'use strict';

const FontResolver = require('../utils/font-resolver');

const STYLES = {
    h1: { fontSize: 24, bold: true, color: '#2c3e50', margin: [0, 14, 0, 8] },
    h2: { fontSize: 18, bold: true, color: '#2c3e50', margin: [0, 12, 0, 6] },
    h3: { fontSize: 15, bold: true, color: '#34495e', margin: [0, 10, 0, 4] },
    h4: { fontSize: 13, bold: true, color: '#34495e', margin: [0, 8, 0, 4] },
    h5: { fontSize: 11, bold: true, color: '#34495e', margin: [0, 6, 0, 3] },
    h6: { fontSize: 10, bold: true, color: '#34495e', margin: [0, 5, 0, 2] },
    body: { fontSize: 11, color: '#333333', lineHeight: 1.4 },
    inlineCode: {
        font: 'Courier',
        background: '#f0f0f0',
        fontSize: 10,
        color: '#333333'
    },
    codeBlock: {
        font: 'Courier',
        background: '#f5f5f5',
        fontSize: 10,
        color: '#333333',
        lineHeight: 1.3,
        margin: [0, 4, 0, 8]
    },
    blockquote: {
        fontSize: 11,
        color: '#666666',
        italics: true,
        border: [false, false, false, { width: 3, color: '#cccccc' }],
        fillColor: '#fafafa',
        margin: [10, 4, 4, 10]
    },
    tableHeader: { bold: true, color: '#2c3e50' }
};

class DocumentBuilder {
    static build(blocks, options) {
        const definition = {
            content: blocks,
            pageSize: options.paperSize,
            pageMargins: [options.margins.left, options.margins.top, options.margins.right, options.margins.bottom],
            defaultStyle: DocumentBuilder.defaultStyle(options),
            styles: STYLES
        };

        if (options.author) {
            definition.info = { author: options.author };
        }
        if (options.password) {
            definition.userPassword = options.password;
            definition.ownerPassword = options.password;
        }
        if (options.watermark) {
            definition.watermark = { text: options.watermark, opacity: 0.12, color: '#888888' };
        }

        return definition;
    }

    static defaultStyle(options) {
        const style = { font: 'Roboto', fontSize: 11, color: '#333333' };
        if (options.font) {
            const descriptor = FontResolver.resolve(options.font);
            if (!descriptor) {
                throw new Error(`Font '${options.font}' is not an installed TrueType font.`);
            }
            style.font = FontResolver.register(descriptor);
        }
        return style;
    }
}

module.exports = DocumentBuilder;