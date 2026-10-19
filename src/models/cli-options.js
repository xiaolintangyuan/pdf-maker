'use strict';

const VALID_DIRECTIONS = ['top', 'bottom', 'left', 'right'];
const DEFAULT_MARGIN = 40;

class CliOptions {
    constructor() {
        this.input = null;
        this.output = null;
        this.help = false;
        this.author = null;
        this.password = null;
        this.watermark = null;
        this.paperSize = 'A4';
        this.margins = { top: DEFAULT_MARGIN, bottom: DEFAULT_MARGIN, left: DEFAULT_MARGIN, right: DEFAULT_MARGIN };
        this.font = null;
    }

    static parse(argv) {
        const options = new CliOptions();
        let index = 0;

        while (index < argv.length) {
            const argument = argv[index];

            if (argument === '-h' || argument === '--help') {
                options.help = true;
            } else if (argument === '-i') {
                index = CliOptions.readValue(argv, index, options, 'input');
            } else if (argument === '-o') {
                index = CliOptions.readValue(argv, index, options, 'output');
            } else if (argument === '--author') {
                index = CliOptions.readValue(argv, index, options, 'author');
            } else if (argument === '--password') {
                index = CliOptions.readValue(argv, index, options, 'password');
            } else if (argument === '--watermark') {
                index = CliOptions.readValue(argv, index, options, 'watermark');
            } else if (argument === '--paper-size') {
                index = CliOptions.readValue(argv, index, options, 'paperSize');
            } else if (argument === '--font') {
                index = CliOptions.readValue(argv, index, options, 'font');
            } else if (argument.startsWith('--margins')) {
                index = CliOptions.readMargin(argv, index, options, argument);
            } else if (options.input === null) {
                options.input = argument;
            } else {
                throw new Error(`Unexpected argument: ${argument}`);
            }

            index = index + 1;
        }

        return options;
    }

    static readValue(argv, index, options, property) {
        if (index + 1 >= argv.length) {
            throw new Error(`Missing value for ${argv[index]}`);
        }
        options[property] = argv[index + 1];
        return index + 1;
    }

    static readMargin(argv, index, options, argument) {
        if (index + 1 >= argv.length) {
            throw new Error(`Missing value for ${argument}`);
        }

        const value = Number(argv[index + 1]);
        if (Number.isNaN(value)) {
            throw new Error(`Margin value must be a number of points: ${argv[index + 1]}`);
        }

        const direction = CliOptions.marginDirection(argument);
        if (direction === null) {
            options.margins.top = value;
            options.margins.bottom = value;
            options.margins.left = value;
            options.margins.right = value;
        } else {
            options.margins[direction] = value;
        }
        return index + 1;
    }

    static marginDirection(argument) {
        if (argument === '--margins') {
            return null;
        }
        const direction = argument.replace('--margins-', '').toLowerCase();
        if (!VALID_DIRECTIONS.includes(direction)) {
            throw new Error(`Invalid margin direction: ${direction}. Use top, bottom, left or right.`);
        }
        return direction;
    }

    static helpText() {
        return [
            'Usage: node pdfmaker -i "path/to/input.md" [-o "path/to/output.pdf"]',
            '',
            'Converts markdown (.md), text (.txt) and html (.html) files into a PDF.',
            'Output defaults to the input directory with a .pdf extension.',
            '',
            'Options:',
            '  -i <file>              Input file (required)',
            '  -o <file>              Output PDF file (default: next to the input file)',
            '  --author <name>        Sets the author of the PDF file',
            '  --password <password>  Password protects the PDF file',
            '  --watermark <text>     Adds a watermark text on each page',
            '  --paper-size <size>    Paper size, ISO 216 (e.g. A4, A3, B4). Default: A4',
            '  --margins <points>     Sets all margins in points',
            '  --margins-<direction> <points>',
            '                         Sets one margin: top, bottom, left or right',
            '  --font <name>          Default font, must be an installed TrueType font',
            '  -h, --help             Shows this help'
        ].join('\n');
    }
}

module.exports = CliOptions;