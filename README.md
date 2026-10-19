# PDF Maker

![Node.js](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)
![Built with](https://img.shields.io/badge/built%20with-pdfmake-red)

A small command-line tool that converts Markdown, plain text and HTML files into PDF documents. The input type is detected from the file extension.

## Features

- Converts `.md`, `.txt` and `.html` files to PDF with a single command
- Output file defaults to the input's directory and name, with a `.pdf` extension
- Set the PDF author, add a watermark, or password protect the document
- Choose an ISO 216 paper size (`A4`, `A3`, `B4`, ...)
- Control margins for all sides at once, or per side
- Use any installed TrueType font as the default font
- Remote resources are blocked: the tool never makes network requests while building a PDF

## Requirements

- [Node.js](https://nodejs.org/) 20 or later
- Windows, if you want to use `--font` (fonts are looked up in the Windows font folders)

## Installation

```bash
git clone https://github.com/xiaolintangyuan/pdf-maker
cd pdfmaker
npm install
```

## Usage

```bash
node pdfmaker -i "path/to/input.md" [-o "path/to/output.pdf"] [options]
```

The input file can also be passed as the first positional argument:

```bash
node pdfmaker notes.md
```

### Examples

```bash
# Convert a markdown file; writes samples/sample.pdf next to the input
node pdfmaker -i samples/sample.md

# Choose the output path
node pdfmaker -i samples/sample.html -o out/report.pdf

# Set author, watermark and paper size
node pdfmaker -i samples/rich.md --author "Jane Doe" --watermark "DRAFT" --paper-size A3

# Password protect the PDF and use a custom font
node pdfmaker -i samples/sample.txt --password "s3cret" --font Georgia

# 60 pt margins on all sides, except a 100 pt left margin
node pdfmaker -i samples/sample.md --margins 60 --margins-left 100
```

## Options

| Option | Description |
| --- | --- |
| `-i <file>` | Input file (`.md`, `.markdown`, `.txt`, `.text`, `.html`, `.htm`). Required |
| `-o <file>` | Output PDF path. Default: input directory, same name with `.pdf` extension |
| `--author <name>` | Sets the author in the PDF metadata |
| `--password <password>` | Password protects the PDF |
| `--watermark <text>` | Adds the text as a watermark on every page |
| `--paper-size <size>` | ISO 216 paper size such as `A4`, `A3` or `B4`. Default: `A4` |
| `--margins <points>` | Sets all four margins, in points. Default: `40` |
| `--margins-<direction> <points>` | Sets one margin: `top`, `bottom`, `left` or `right` |
| `--font <name>` | Default font. Must be an installed TrueType font |
| `-h`, `--help` | Shows the help text |

Margins are in points (1 pt = 1/72 inch). Options are applied in order, so put `--margins` before any `--margins-<direction>` option that should override it.

## Supported Content

### Markdown

Headings (`#` to `######`), paragraphs, **bold**, *italic*, `inline code`, links, fenced code blocks, blockquotes, horizontal rules, tables, and ordered and unordered lists including nested lists.

### HTML

Headings, paragraphs, block containers (`div`, `section`, `article`, ...), lists (including nested), tables, `pre` code blocks, blockquotes, `hr` and `br`. Images are replaced by their `alt` text in square brackets. Inline formatting tags (`b`, `i`, `a`, ...) are dropped and only their text is kept. `head`, `script` and `style` content is ignored.

### Plain text

Blank lines separate paragraphs. Lines within a paragraph are joined with a space.

### Not supported

Images, remote or URL resources, full CommonMark, full HTML compliance, and non-TrueType fonts.

## Project Structure

```
pdfmaker/
├── pdfmaker.js                  # CLI entry point
├── src/
│   ├── models/
│   │   ├── cli-options.js       # Argument parsing and help text
│   │   ├── markdown-parser.js   # Markdown -> pdfmake content blocks
│   │   ├── html-parser.js       # HTML -> pdfmake content blocks
│   │   ├── text-parser.js       # Plain text -> pdfmake content blocks
│   │   └── document-builder.js  # Builds the pdfmake document definition
│   └── utils/
│       ├── font-resolver.js     # Finds and registers installed TrueType fonts
│       └── pdf-writer.js        # Renders and writes the PDF
└── samples/                     # Example inputs and generated PDFs
```

### How it works

```
argv -> CliOptions -> read input -> Markdown/Text/Html parser -> content blocks
     -> DocumentBuilder (styles, page setup, metadata) -> PdfWriter -> output.pdf
```

## Samples

The [samples](samples) folder contains input files (`sample.md`, `rich.md`, `sample.txt`, `sample.html`).

## Built With

- [pdfmake](https://github.com/bpampuch/pdfmake) 0.3.x - PDF generation

## License

[MIT](https://opensource.org/licenses/MIT)
