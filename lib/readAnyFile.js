import { getTextExtractor } from 'office-text-extractor'

export function readAnyFile(filePath) {
    const extractor = getTextExtractor()
    return extractor.extractText({ input: filePath, type: 'file' });
}