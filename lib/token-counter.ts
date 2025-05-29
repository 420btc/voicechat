/**
 * More accurate token estimation without tiktoken dependency
 * Based on OpenAI's tokenization patterns and research
 */

/**
 * Calculate the number of tokens for a given text and model
 * @param text - The text to tokenize
 * @param model - The OpenAI model name (defaults to gpt-4o)
 * @returns The number of tokens
 */
export function calculateTokens(text: string, model: string = 'gpt-4o'): number {
  if (!text || text.length === 0) return 0
  
  // More sophisticated token estimation
  // Based on analysis of OpenAI tokenization patterns
  
  // Split by common token boundaries
  const words = text.split(/\s+/)
  let tokenCount = 0
  
  for (const word of words) {
    if (word.length === 0) continue
    
    // Common words (1 token)
    if (word.length <= 3) {
      tokenCount += 1
    }
    // Medium words (usually 1-2 tokens)
    else if (word.length <= 6) {
      tokenCount += Math.ceil(word.length / 4)
    }
    // Longer words (more complex tokenization)
    else {
      // Account for subword tokenization
      tokenCount += Math.ceil(word.length / 3.5)
    }
    
    // Add extra tokens for special characters
    const specialChars = (word.match(/[^a-zA-Z0-9\s]/g) || []).length
    tokenCount += Math.ceil(specialChars / 2)
  }
  
  // Add tokens for punctuation and special formatting
  const punctuation = (text.match(/[.!?;:,"'()\[\]{}]/g) || []).length
  tokenCount += Math.ceil(punctuation / 2)
  
  // Minimum token count (at least 1 token per 4 characters as baseline)
  const minTokens = Math.ceil(text.length / 4)
  
  return Math.max(tokenCount, minTokens)
}

/**
 * Calculate tokens for a conversation messages array
 * @param messages - Array of conversation messages
 * @param model - The OpenAI model name
 * @returns The total number of tokens
 */
export function calculateConversationTokens(
  messages: Array<{ role: string; content: string }>,
  model: string = 'gpt-4o'
): number {
  let totalTokens = 0
  
  // Add tokens for each message
  for (const message of messages) {
    // Each message has overhead tokens for formatting
    totalTokens += 4 // <im_start>{role/name}\n{content}<im_end>\n
    
    // Add tokens for role
    totalTokens += calculateTokens(message.role, model)
    
    // Add tokens for content
    totalTokens += calculateTokens(message.content, model)
  }
  
  // Every reply is primed with <im_start>assistant
  totalTokens += 2
  
  return totalTokens
}