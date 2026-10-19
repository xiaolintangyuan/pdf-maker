'use strict';

class TextParser {
    static parse(text) {
        const lines = text.split(/\r?\n/);
        const blocks = [];
        let paragraphLines = [];

        const flushParagraph = function () {
            if (paragraphLines.length > 0) {
                blocks.push({ text: paragraphLines.join(' '), style: 'body' });
                paragraphLines = [];
            }
        };

        for (const line of lines) {
            if (line.trim() === '') {
                flushParagraph();
            } else {
                paragraphLines.push(line.trim());
            }
        }
        flushParagraph();

        return blocks;
    }
}

module.exports = TextParser;