'use strict';

const fs = require('fs');
const path = require('path');
const pdfmake = require('pdfmake');

const FONT_DIRECTORIES = [
    path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts'),
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft\\Windows\\Fonts')
];
const VARIANT_SUFFIXES = ['bd', 'bi', 'i'];
const registeredFonts = new Map();

class FontResolver {
    static resolve(fontName) {
        const filePath = FontResolver.findFontFile(fontName);
        if (!filePath) {
            return null;
        }
        return {
            normal: filePath,
            bold: FontResolver.findVariant(filePath, 'bd') || filePath,
            italics: FontResolver.findVariant(filePath, 'i') || filePath,
            bolditalics: FontResolver.findVariant(filePath, 'bi') || filePath
        };
    }

    static register(descriptor) {
        const key = descriptor.normal;
        if (registeredFonts.has(key)) {
            return registeredFonts.get(key);
        }
        const familyName = `CustomFont${registeredFonts.size + 1}`;
        const fonts = {};
        fonts[familyName] = descriptor;
        pdfmake.addFonts(fonts);
        registeredFonts.set(key, familyName);
        return familyName;
    }

    static findFontFile(fontName) {
        const wanted = fontName.toLowerCase().replace(/\.ttf$/i, '');
        for (const directory of FONT_DIRECTORIES) {
            if (!directory) {
                continue;
            }
            const candidates = FontResolver.listFontFiles(directory);
            for (const candidate of candidates) {
                const baseName = path.basename(candidate).toLowerCase().replace(/\.ttf$/, '');
                if (baseName === wanted) {
                    return candidate;
                }
            }
            for (const candidate of candidates) {
                const baseName = path.basename(candidate).toLowerCase().replace(/\.ttf$/, '');
                if (baseName.startsWith(wanted)) {
                    return candidate;
                }
            }
        }
        return null;
    }

    static listFontFiles(directory) {
        try {
            return fs.readdirSync(directory)
                .filter(function (entry) {
                    return entry.toLowerCase().endsWith('.ttf');
                })
                .map(function (entry) {
                    return path.join(directory, entry);
                });
        } catch (error) {
            return [];
        }
    }

    static findVariant(normalPath, suffix) {
        const directory = path.dirname(normalPath);
        const baseName = path.basename(normalPath).toLowerCase().replace(/\.ttf$/, '');
        const stripped = baseName.replace(new RegExp(`[-_ ]?${suffix}$`), '');
        const expected = `${stripped}-${suffix}.ttf`;
        const candidates = FontResolver.listFontFiles(directory);
        for (const candidate of candidates) {
            const candidateName = path.basename(candidate).toLowerCase();
            if (candidateName === expected || candidateName === `${stripped}${suffix}.ttf`) {
                return candidate;
            }
        }
        return null;
    }
}

module.exports = FontResolver;