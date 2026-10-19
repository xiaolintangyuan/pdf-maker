# Rich Markdown Showcase

This document exercises every Markdown construct that PDF Maker can render. It is long enough to run onto a second page, which makes it useful for checking margins, watermarks and paper sizes.

## Headings

# Heading level 1
## Heading level 2
### Heading level 3
#### Heading level 4
##### Heading level 5
###### Heading level 6

## Paragraphs and inline styles

A paragraph can span several source lines.
Consecutive lines are joined into a single paragraph,
just like they are in standard Markdown.

Inline styles: **bold with asterisks**, __bold with underscores__, *italic with asterisks*, _italic with underscores_, and `inline code`. A link looks like [the pdfmake project](https://github.com/bpampuch/pdfmake) and is underlined in the PDF.

Styles can be mixed within one sentence: a **bold** word, an *italic* word, a `code` word, and a [link](https://example.com) all sit side by side.

## Unordered lists

- First item
- Second item with **bold** and `code`
- Third item with a [link](https://example.com)

Different markers are accepted:

* Asterisk item
* Another asterisk item

+ Plus item
+ Another plus item

## Ordered lists

1. Prepare the input file
2. Run the converter
3. Open the generated PDF

## Nested lists

- Fruit
    - Apples
        - Granny Smith
        - Fuji
    - Oranges
- Vegetables
    - Carrots
    - Spinach
- Grains

1. Setup
    1. Install Node.js
    2. Run npm install
2. Usage
    1. Choose an input file
    2. Pick your options
3. Done

A bullet list with an ordered list inside:

- Release checklist
    1. Update the version
    2. Run the tests
    3. Publish
- Post-release
    1. Announce
    2. Collect feedback

## Blockquotes

> A blockquote with **bold** text, *italic* text and a [link](https://example.com).
> This second line is part of the same quote.

> A separate quote, rendered in its own shaded block.

## Code blocks

A code block keeps its line breaks and indentation:

```
function greet(name) {
    return "Hello, " + name + "!";
}

console.log(greet("PDF Maker"));
```

A block with a language hint renders the same way:

```javascript
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(function (value) {
    return value * 2;
});
```

## Horizontal rules

Content above the rule.

---

Content between two rules.

***

Content below the rules.

## Tables

A simple table:

| Name | Role | Location |
| --- | --- | --- |
| Alice | Engineer | London |
| Bob | Designer | Berlin |
| Carol | Manager | Tokyo |

A table with inline formatting in its cells:

| Option | Example | Notes |
| --- | --- | --- |
| `--author` | `--author "Jane"` | Sets the **author** metadata |
| `--watermark` | `--watermark DRAFT` | Printed on *every* page |
| `--paper-size` | `--paper-size A3` | Any ISO 216 size |
| `--margins` | `--margins 60` | Value is in [points](https://en.wikipedia.org/wiki/Point) |

A table with an alignment row and a short body row (missing cells are left empty):

| Left | Center | Right |
|:-----|:------:|------:|
| a | b | c |
| d | e |

## Everything together

Closing paragraph with **bold**, *italic*, `code` and a [link](https://example.com), followed by a list:

- Headings, paragraphs and inline styles
- Ordered, unordered and nested lists
- Blockquotes, code blocks and horizontal rules
- Tables

> That is every block type the Markdown parser understands.
