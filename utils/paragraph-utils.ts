/**
 * Detects paragraphs in text based on double line breaks or other indicators
 */
export function detectParagraphs(text: string): string[] {
  // Split text by double line breaks (standard paragraph separator)
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0)

  // If no paragraphs were found (no double line breaks), try to detect paragraphs
  // based on indentation or single line breaks
  if (paragraphs.length <= 1) {
    return text.split(/\n/).filter((p) => p.trim().length > 0)
  }

  return paragraphs
}

/**
 * Calculates timing information for paragraphs based on enhanced heuristics
 */
export function calculateParagraphTimings(
  paragraphs: string[],
  totalDuration: number,
): Array<{ text: string; startTime: number; endTime: number }> {
  const result = []
  let currentTime = 0

  // First pass: Calculate estimated durations based on content
  const estimatedDurations = paragraphs.map((paragraph) => {
    // Base duration on character count
    let duration = paragraph.length * 0.06 // ~60ms per character

    // Adjust for punctuation (more punctuation = more pauses)
    const punctuationCount = (paragraph.match(/[.,;:?!]/g) || []).length
    duration += punctuationCount * 0.2 // Add 200ms per punctuation mark

    // Adjust for paragraph complexity
    const sentenceCount = (paragraph.match(/[.!?]+/g) || []).length || 1
    const avgSentenceLength = paragraph.length / sentenceCount

    // Longer sentences take proportionally longer to read
    if (avgSentenceLength > 100) duration *= 1.2
    else if (avgSentenceLength < 30) duration *= 0.9

    return duration
  })

  // Calculate total estimated duration
  const totalEstimatedDuration = estimatedDurations.reduce((sum, duration) => sum + duration, 0)

  // Scale factor to match actual audio duration
  const scaleFactor = totalDuration / totalEstimatedDuration

  // Second pass: Create timed paragraphs with scaled durations
  paragraphs.forEach((paragraph, index) => {
    const scaledDuration = estimatedDurations[index] * scaleFactor

    result.push({
      text: paragraph,
      startTime: currentTime,
      endTime: currentTime + scaledDuration,
    })

    currentTime += scaledDuration
  })

  return result
}
