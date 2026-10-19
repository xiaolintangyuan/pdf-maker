'use strict';

class MarkdownParser {
    static parse(markdown) {
        const lines = markdown.split(/\r?\n/);
        const blocks = [];
        let index = 0;

        while (index < lines.length) {
            const line = lines[index];

            if (line.trim() === '') {
                index = index + 1;
                continue;
            }

            if (line.startsWith('```')) {
                index = MarkdownParser.readCodeBlock(lines, index, blocks);
                continue;
            }

            const heading = line.match(/^(#{1,6})\s+(.*)$/);
            if (heading) {
                const level = heading[1].length;
                blocks.push({ text: MarkdownParser.parseInline(heading[2]), style: `h${level}` });
                index = index + 1;
                continue;
            }

            if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
                blocks.push({ canvas: [MarkdownParser.horizontalRule()] });
                index = index + 1;
                continue;
            }

            if (MarkdownParser.isTableStart(lines, index)) {
                index = MarkdownParser.readTable(lines, index, blocks);
                continue;
            }

            if (MarkdownParser.isListItem(line)) {
                index = MarkdownParser.readList(lines, index, blocks);
                continue;
            }

            if (line.startsWith('>')) {
                index = MarkdownParser.readQuote(lines, index, blocks);
                continue;
            }

            index = MarkdownParser.readParagraph(lines, index, blocks);
        }

        return blocks;
    }

    static readCodeBlock(lines, index, blocks) {
        const codeLines = [];
        index = index + 1;
        while (index < lines.length && !lines[index].startsWith('```')) {
            codeLines.push(lines[index]);
            index = index + 1;
        }
        blocks.push({ text: codeLines.join('\n'), style: 'codeBlock', preserveSpace: true });
        return index + 1;
    }

    static isTableStart(lines, index) {
        if (!MarkdownParser.isTableRow(lines[index])) {
            return false;
        }
        if (index + 1 >= lines.length) {
            return false;
        }
        return MarkdownParser.isSeparatorRow(lines[index + 1]);
    }

    static isTableRow(line) {
        return /^\|(.+\|)+\s*$/.test(line);
    }

    static isSeparatorRow(line) {
        return /^\|?[\s|:-]+\|?\s*$/.test(line) && line.includes('-');
    }

    static readTable(lines, index, blocks) {
        const headerCells = MarkdownParser.parseTableRow(lines[index]);
        index = index + 2;
        const bodyRows = [];
        while (index < lines.length && MarkdownParser.isTableRow(lines[index])) {
            bodyRows.push(MarkdownParser.parseTableRow(lines[index]));
            index = index + 1;
        }
        blocks.push(MarkdownParser.buildTable(headerCells, bodyRows));
        return index;
    }

    static parseTableRow(line) {
        const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|');
        return cells.map(function (cell) {
            return MarkdownParser.parseInline(cell.trim());
        });
    }

    static buildTable(headerCells, bodyRows) {
        const columnCount = headerCells.length;
        const headerRow = headerCells.map(function (cell) {
            return { text: cell, bold: true, style: 'tableHeader' };
        });
        const body = bodyRows.map(function (row) {
            const paddedRow = row.slice(0, columnCount);
            while (paddedRow.length < columnCount) {
                paddedRow.push('');
            }
            return paddedRow;
        });
        const widths = [];
        for (let column = 0; column < columnCount; column = column + 1) {
            widths.push('*');
        }
        return {
            table: {
                headerRows: 1,
                widths: widths,
                body: [headerRow].concat(body)
            },
            layout: 'lightHorizontalLines',
            margin: [0, 4, 0, 8]
        };
    }

    static isListItem(line) {
        return /^(\s*)([-*+]|\d+\.)\s+/.test(line);
    }

    static readList(lines, index, blocks) {
        const firstMatch = lines[index].match(/^(\s*)([-*+]|\d+\.)\s+/);
        const baseIndent = firstMatch[1].length;
        const ordered = /\d+\./.test(firstMatch[2]);
        const itemLines = [];

        while (index < lines.length && MarkdownParser.isListItem(lines[index])) {
            const match = lines[index].match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
            if (match[1].length < baseIndent) {
                break;
            }
            itemLines.push({
                indent: match[1].length,
                text: match[3],
                ordered: /\d+\./.test(match[2])
            });
            index = index + 1;
        }

        const listKey = ordered ? 'ol' : 'ul';
        const list = {};
        list[listKey] = MarkdownParser.buildListItems(itemLines);
        list.margin = [0, 2, 0, 6];
        blocks.push(list);
        return index;
    }

    static buildListItems(itemLines) {
        const items = [];
        let position = 0;

        while (position < itemLines.length) {
            const item = itemLines[position];
            const childLines = [];
            position = position + 1;
            while (position < itemLines.length && itemLines[position].indent > item.indent) {
                childLines.push(itemLines[position]);
                position = position + 1;
            }

            const text = MarkdownParser.parseInline(item.text);
            if (childLines.length > 0) {
                const nestedList = MarkdownParser.buildNestedList(childLines);
                items.push({ stack: [text, nestedList] });
            } else {
                items.push(text);
            }
        }

        return items;
    }

    static buildNestedList(childLines) {
        const childIndent = childLines[0].indent;
        const ordered = childLines[0].ordered;
        const listKey = ordered ? 'ol' : 'ul';
        const nestedList = {};
        nestedList[listKey] = MarkdownParser.buildListItems(childLines);
        nestedList.margin = [14, 0, 0, 0];
        return nestedList;
    }

    static readQuote(lines, index, blocks) {
        const quoteLines = [];
        while (index < lines.length && lines[index].startsWith('>')) {
            quoteLines.push(lines[index].replace(/^>\s?/, ''));
            index = index + 1;
        }
        blocks.push({ text: MarkdownParser.parseInline(quoteLines.join(' ')), style: 'blockquote' });
        return index;
    }

    static readParagraph(lines, index, blocks) {
        const paragraphLines = [];
        while (index < lines.length && lines[index].trim() !== '') {
            const line = lines[index];
            if (MarkdownParser.startsNewBlock(line)) {
                break;
            }
            paragraphLines.push(line.trim());
            index = index + 1;
        }
        if (paragraphLines.length > 0) {
            blocks.push({ text: MarkdownParser.parseInline(paragraphLines.join(' ')), style: 'body' });
        }
        return index;
    }

    static startsNewBlock(line) {
        if (/^(#{1,6})\s+/.test(line)) {
            return true;
        }
        if (line.startsWith('```') || line.startsWith('>')) {
            return true;
        }
        if (MarkdownParser.isListItem(line)) {
            return true;
        }
        if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
            return true;
        }
        return false;
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

    static parseInline(text) {
        const tokens = MarkdownParser.tokenizeInline(text);
        const stack = [{ bold: false, italics: false, code: false, link: null }];
        const root = { children: [] };
        const openNodes = [root];

        const closeTopNode = function () {
            const node = openNodes.pop();
            stack.pop();
            const parent = openNodes[openNodes.length - 1];
            parent.children.push(MarkdownParser.flattenChildren(node.children));
        };

        for (const token of tokens) {
            const state = stack[stack.length - 1];

            if (token.type === 'codeClose' && state.code) {
                closeTopNode();
                continue;
            }
            if (token.type === 'codeOpen') {
                stack.push({ bold: state.bold, italics: state.italics, code: true, link: state.link });
                openNodes.push({ children: [] });
                continue;
            }
            if (token.type === 'boldClose' && state.bold) {
                closeTopNode();
                continue;
            }
            if (token.type === 'boldOpen') {
                stack.push({ bold: true, italics: state.italics, code: state.code, link: state.link });
                openNodes.push({ children: [] });
                continue;
            }
            if (token.type === 'italicClose' && state.italics) {
                closeTopNode();
                continue;
            }
            if (token.type === 'italicOpen') {
                stack.push({ bold: state.bold, italics: true, code: state.code, link: state.link });
                openNodes.push({ children: [] });
                continue;
            }
            if (token.type === 'linkClose' && state.link) {
                closeTopNode();
                continue;
            }
            if (token.type === 'linkOpen') {
                stack.push({ bold: state.bold, italics: state.italics, code: state.code, link: token.href });
                openNodes.push({ children: [] });
                continue;
            }

            const node = MarkdownParser.textNode(token.text, stack[stack.length - 1]);
            openNodes[openNodes.length - 1].children.push(node);
        }

        MarkdownParser.closeOpenNodes(openNodes);
        return MarkdownParser.flattenChildren(root.children);
    }

    static tokenizeInline(text) {
        const pattern = /(`+)([\s\S]+?)\1|\*\*([\s\S]+?)\*\*|__([\s\S]+?)__|(\[)([^\]]+)(\]\()([^)]+)(\))|(\*+)([\s\S]+?)\1|(_+)([\s\S]+?)\1/g;
        const tokens = [];
        let position = 0;
        let match;

        while ((match = pattern.exec(text)) !== null) {
            if (match.index > position) {
                tokens.push({ type: 'text', text: text.slice(position, match.index) });
            }

            if (match[1]) {
                tokens.push({ type: 'codeOpen' });
                tokens.push({ type: 'text', text: match[2] });
                tokens.push({ type: 'codeClose' });
            } else if (match[3] !== undefined || match[4] !== undefined) {
                tokens.push({ type: 'boldOpen' });
                tokens.push({ type: 'text', text: match[3] !== undefined ? match[3] : match[4] });
                tokens.push({ type: 'boldClose' });
            } else if (match[5]) {
                tokens.push({ type: 'linkOpen', href: match[8] });
                tokens.push({ type: 'text', text: match[6] });
                tokens.push({ type: 'linkClose' });
            } else if (match[9]) {
                tokens.push({ type: 'italicOpen' });
                tokens.push({ type: 'text', text: match[10] });
                tokens.push({ type: 'italicClose' });
            } else if (match[11]) {
                tokens.push({ type: 'italicOpen' });
                tokens.push({ type: 'text', text: match[12] });
                tokens.push({ type: 'italicClose' });
            }

            position = pattern.lastIndex;
        }

        if (position < text.length) {
            tokens.push({ type: 'text', text: text.slice(position) });
        }
        return tokens;
    }

    static textNode(text, state) {
        const node = { text: text };
        if (state.bold) {
            node.bold = true;
        }
        if (state.italics) {
            node.italics = true;
        }
        if (state.code) {
            node.style = 'inlineCode';
        }
        if (state.link) {
            node.link = state.link;
            node.decoration = 'underline';
        }
        return node;
    }

    static closeOpenNodes(openNodes) {
        while (openNodes.length > 1) {
            const node = openNodes.pop();
            const parent = openNodes[openNodes.length - 1];
            parent.children.push(MarkdownParser.flattenChildren(node.children));
        }
    }

    static flattenChildren(children) {
        if (children.length === 1 && children[0].text !== undefined && MarkdownParser.isPlainNode(children[0])) {
            return children[0];
        }
        return children;
    }

    static isPlainNode(node) {
        const keys = Object.keys(node);
        return keys.length === 1 && keys[0] === 'text';
    }
}

module.exports = MarkdownParser;