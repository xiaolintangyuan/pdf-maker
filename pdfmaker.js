#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const CliOptions = require('./src/models/cli-options');
const MarkdownParser = require('./src/models/markdown-parser');
const TextParser = require('./src/models/text-parser');
const HtmlParser = require('./src/models/html-parser');
const DocumentBuilder = require('./src/models/document-builder');
const PdfWriter = require('./src/utils/pdf-writer');

const PARSERS = {
    '.md': MarkdownParser,
    '.markdown': MarkdownParser,
    '.txt': TextParser,
    '.text': TextParser,
    '.html': HtmlParser,
    '.htm': HtmlParser
};

async function run() {
    let options;
    try {
        options = CliOptions.parse(process.argv.slice(2));
    } catch (error) {
        console.error(`Error: ${error.message}`);
        console.error('');
        console.error(CliOptions.helpText());
        process.exitCode = 1;
        return;
    }

    if (options.help) {
        console.log(CliOptions.helpText());
        return;
    }

    if (!options.input) {
        console.error('Error: missing input file.');
        console.error('');
        console.error(CliOptions.helpText());
        process.exitCode = 1;
        return;
    }

    const inputPath = path.resolve(options.input);
    const extension = path.extname(inputPath).toLowerCase();
    const parser = PARSERS[extension];
    if (!parser) {
        console.error(`Error: unsupported input type '${extension}'. Supported: .md, .txt, .html`);
        process.exitCode = 1;
        return;
    }

    let source;
    try {
        source = fs.readFileSync(inputPath, 'utf8');
    } catch (error) {
        console.error(`Error: cannot read input file: ${error.message}`);
        process.exitCode = 1;
        return;
    }

    const outputPath = options.output
        ? path.resolve(options.output)
        : path.join(path.dirname(inputPath), `${path.basename(inputPath, extension)}.pdf`);

    try {
        const blocks = parser.parse(source);
        const definition = DocumentBuilder.build(blocks, options);
        await PdfWriter.write(definition, outputPath);
        console.log(`PDF written to ${outputPath}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exitCode = 1;
    }
}

run();