'use strict';

const BLOCK_TAGS = new Set([
    'address', 'article', 'aside', 'div', 'footer', 'header', 'main', 'nav', 'section'
]);
const IGNORED_TAGS = new Set([
    'head', 'script', 'style', 'meta', 'link', 'title', 'noscript', 'template'
]);
const PARAGRAPH_TAGS = new Set(['p']);
const HEADING_STYLES = {
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6'
};

class HtmlParser {
    static parse(html) {
        const cleaned = HtmlParser.stripMarkup(html);
        const tokens = HtmlParser.tokenize(cleaned);
        const blocks = [];
        const listStack = [];
        const quoteStack = [];
        let inlineBuffer = [];
        let codeBuffer = null;
        let tableRows = null;
        let tableRow = null;
        let tableCell = null;
        let currentItem = null;

        const flushInline = function () {
            const text = inlineBuffer.join('');
            inlineBuffer = [];
            if (text.trim() === '') {
                return;
            }
            const node = { text: text };
            if (quoteStack.length > 0) {
                node.style = 'blockquote';
            } else {
                node.style = 'body';
            }
            blocks.push(node);
        };

        const currentList = function () {
            if (listStack.length === 0) {
                return null;
            }
            return listStack[listStack.length - 1];
        };

        for (const token of tokens) {
            if (token.type === 'text') {
                if (codeBuffer !== null) {
                    codeBuffer.push(token.text);
                } else if (tableCell !== null) {
                    tableCell.push(token.text);
                } else if (currentItem) {
                    currentItem.text = currentItem.text + HtmlParser.decodeEntities(token.text);
                } else {
                    inlineBuffer.push(HtmlParser.decodeEntities(token.text));
                }
                continue;
            }

            const tag = token.name;

            if (IGNORED_TAGS.has(tag) && token.type === 'open') {
                continue;
            }
            if (tag === 'br') {
                if (currentItem) {
                    currentItem.text = currentItem.text + '\n';
                } else {
                    inlineBuffer.push('\n');
                }
                continue;
            }
            if (tag === 'hr') {
                flushInline();
                blocks.push({ canvas: [HtmlParser.horizontalRule()] });
                continue;
            }
            if (tag === 'img') {
                const alt = token.attributes.alt || '';
                if (alt !== '') {
                    if (currentItem) {
                        currentItem.text = currentItem.text + `[${alt}]`;
                    } else {
                        inlineBuffer.push(`[${alt}]`);
                    }
                }
                continue;
            }

            if (codeBuffer !== null) {
                if (token.type === 'open' && tag === 'pre') {
                    flushInline();
                    blocks.push({ text: codeBuffer.join('').replace(/^\n+|\n+$/g, ''), style: 'codeBlock', preserveSpace: true });
                    codeBuffer = null;
                }
                continue;
            }

            if (tableCell !== null) {
                if (token.type === 'close' && (tag === 'td' || tag === 'th')) {
                    tableRow.push(tableCell.join('').trim());
                    tableCell = null;
                }
                continue;
            }

            if (tableRow !== null) {
                if (token.type === 'close' && tag === 'tr') {
                    tableRows.push(tableRow);
                    tableRow = null;
                }
                continue;
            }

            if (tableRows !== null) {
                if (token.type === 'close' && tag === 'table') {
                    flushInline();
                    blocks.push(HtmlParser.buildTable(tableRows));
                    tableRows = null;
                }
                continue;
            }

            if (token.type === 'open') {
                if (tag === 'pre') {
                    flushInline();
                    codeBuffer = [];
                    continue;
                }
                if (tag === 'table') {
                    flushInline();
                    tableRows = [];
                    continue;
                }
                if (tag === 'tr') {
                    tableRow = [];
                    continue;
                }
                if (tag === 'td' || tag === 'th') {
                    tableCell = [];
                    continue;
                }
                if (tag === 'ul' || tag === 'ol') {
                    flushInline();
                    const list = { type: tag, items: [], margin: [0, 2, 0, 6] };
                    listStack.push(list);
                    continue;
                }
                if (tag === 'li') {
                    flushInline();
                    currentItem = { text: '' };
                    continue;
                }
                if (tag === 'blockquote') {
                    flushInline();
                    quoteStack.push(true);
                    continue;
                }
                if (HEADING_STYLES[tag]) {
                    flushInline();
                    inlineBuffer = [];
                    blocks.push({ text: '', style: HEADING_STYLES[tag], pendingHeading: true });
                    continue;
                }
                if (PARAGRAPH_TAGS.has(tag) || BLOCK_TAGS.has(tag)) {
                    flushInline();
                    continue;
                }
                continue;
            }

            if (token.type === 'close') {
                if (tag === 'li') {
                    flushInline();
                    const list = currentList();
                    if (list && currentItem) {
                        if (currentItem.ul || currentItem.ol) {
                            list.items.push(currentItem);
                        } else {
                            list.items.push(currentItem.text);
                        }
                    }
                    currentItem = null;
                    continue;
                }
                if (tag === 'ul' || tag === 'ol') {
                    flushInline();
                    const list = listStack.pop();
                    if (list) {
                        const listNode = {};
                        listNode[list.type] = list.items;
                        listNode.margin = list.margin;
                        if (currentItem) {
                            currentItem[list.type] = list.items;
                        } else {
                            const parentList = currentList();
                            if (parentList) {
                                parentList.items.push(listNode);
                            } else {
                                blocks.push(listNode);
                            }
                        }
                    }
                    continue;
                }
                if (tag === 'blockquote') {
                    flushInline();
                    quoteStack.pop();
                    continue;
                }
                if (HEADING_STYLES[tag]) {
                    const text = inlineBuffer.join('').trim();
                    inlineBuffer = [];
                    const last = blocks[blocks.length - 1];
                    if (last && last.pendingHeading) {
                        last.text = text;
                        delete last.pendingHeading;
                    }
                    continue;
                }
                if (PARAGRAPH_TAGS.has(tag) || BLOCK_TAGS.has(tag)) {
                    flushInline();
                    continue;
                }
            }
        }

        flushInline();
        return blocks;
    }

    static buildTable(rows) {
        if (rows.length === 0) {
            return { text: '' };
        }
        const columnCount = Math.max.apply(null, rows.map(function (row) {
            return row.length;
        }));
        const body = rows.map(function (row, rowIndex) {
            const paddedRow = row.slice(0, columnCount);
            while (paddedRow.length < columnCount) {
                paddedRow.push('');
            }
            return paddedRow.map(function (cell) {
                const node = { text: cell };
                if (rowIndex === 0) {
                    node.bold = true;
                    node.style = 'tableHeader';
                }
                return node;
            });
        });
        const widths = [];
        for (let column = 0; column < columnCount; column = column + 1) {
            widths.push('*');
        }
        return {
            table: {
                headerRows: 1,
                widths: widths,
                body: body
            },
            layout: 'lightHorizontalLines',
            margin: [0, 4, 0, 8]
        };
    }

    static horizontalRule() {
        return {
            type: 'line',
            x1: 0,
            y1: 0,
            x2: 555,
            y2: 0,
            lineWidth: 1,
            lineColor: '#cccccc'
        };
    }

    static stripMarkup(html) {
        let text = html.replace(/<!--[\s\S]*?-->/g, ' ');
        text = text.replace(/<!DOCTYPE[^>]*>/gi, ' ');
        text = text.replace(/<\/?(html|body)[^>]*>/gi, ' ');
        return text;
    }

    static tokenize(html) {
        const tokens = [];
        const pattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;
        let position = 0;
        let match;

        while ((match = pattern.exec(html)) !== null) {
            if (match.index > position) {
                tokens.push({ type: 'text', text: html.slice(position, match.index) });
            }
            const isClose = html[match.index + 1] === '/';
            tokens.push({
                type: isClose ? 'close' : 'open',
                name: match[1].toLowerCase(),
                attributes: HtmlParser.parseAttributes(match[2])
            });
            position = pattern.lastIndex;
        }

        if (position < html.length) {
            tokens.push({ type: 'text', text: html.slice(position) });
        }
        return tokens;
    }

    static parseAttributes(attributeText) {
        const attributes = {};
        const pattern = /([a-zA-Z-]+)\s*=\s*"([^"]*)"|([a-zA-Z-]+)\s*=\s*'([^']*)'/g;
        let match;

        while ((match = pattern.exec(attributeText)) !== null) {
            const name = (match[1] || match[3]).toLowerCase();
            attributes[name] = match[2] !== undefined ? match[2] : match[4];
        }
        return attributes;
    }

    static decodeEntities(text) {
        return text
            .replace(/&nbsp;/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, '&');
    }
}

module.exports = HtmlParser;