/**
 * Splits text into chunks of approximately the specified size,
 * trying to break at natural boundaries like paragraphs and sentences.
 */
export function chunkText(text: string, maxChunkSize = 4000): string[] {
  // If text is already small enough, return it as a single chunk
  if (text.length <= maxChunkSize) {
    return [text]
  }

  const chunks: string[] = []
  let remainingText = text

  while (remainingText.length > 0) {
    // If remaining text fits in a chunk, add it and we're done
    if (remainingText.length <= maxChunkSize) {
      chunks.push(remainingText)
      break
    }

    // Try to find a paragraph break within the maxChunkSize
    let splitIndex = remainingText.lastIndexOf("\n\n", maxChunkSize)

    // If no paragraph break, try to find a sentence break
    if (splitIndex === -1 || splitIndex < maxChunkSize / 2) {
      splitIndex = findSentenceBreak(remainingText, maxChunkSize)
    }

    // If no good break point found, just split at maxChunkSize
    if (splitIndex === -1 || splitIndex < maxChunkSize / 2) {
      splitIndex = remainingText.lastIndexOf(" ", maxChunkSize)
      if (splitIndex === -1) {
        splitIndex = maxChunkSize
      }
    }

    // Add the chunk and continue with remaining text
    chunks.push(remainingText.substring(0, splitIndex).trim())
    remainingText = remainingText.substring(splitIndex).trim()
  }

  return chunks
}

/**
 * Find a good sentence break near the maxChunkSize
 */
function findSentenceBreak(text: string, maxSize: number): number {
  // Look for sentence endings (.!?) followed by a space or newline
  const sentenceBreaks = [". ", "! ", "? ", ".\n", "!\n", "?\n"]
  let bestBreak = -1

  // Look for the last sentence break before maxSize
  for (const breakChar of sentenceBreaks) {
    let index = -1
    let lastIndex = -1

    // Find the last occurrence of this break character before maxSize
    while ((index = text.indexOf(breakChar, index + 1)) !== -1 && index < maxSize) {
      lastIndex = index + breakChar.length - 1 // Point to the last character of the break
    }

    if (lastIndex > bestBreak) {
      bestBreak = lastIndex
    }
  }

  return bestBreak
}
