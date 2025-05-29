import { encoding_for_model } from 'tiktoken'

/**
 * Calculate the number of tokens for a given text and model
 * @param text - The text to tokenize
 * @param model - The OpenAI model name (defaults to gpt-4o)
 * @returns The number of tokens
 */
export function calculateTokens(text: string, model: string = 'gpt-4o'): number {
  try {
    const encoding = encoding_for_model(model as any)
    const tokens = encoding.encode(text)
    encoding.free() // Free the encoding to prevent memory leaks
    return tokens.length
  } catch (error) {
    console.warn('Error calculating tokens:', error)
    // Fallback: rough estimation (1 token ≈ 4 characters for English)
    return Math.ceil(text.length / 4)
  }
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
  try {
    const encoding = encoding_for_model(model as any)
    let totalTokens = 0
    
    // Add tokens for each message
    for (const message of messages) {
      // Each message has some overhead tokens
      totalTokens += 4 // <im_start>{role/name}\n{content}<im_end>\n
      totalTokens += encoding.encode(message.role).length
      totalTokens += encoding.encode(message.content).length
    }
    
    totalTokens += 2 // Every reply is primed with <im_start>assistant
    
    encoding.free()
    return totalTokens
  } catch (error) {
    console.warn('Error calculating conversation tokens:', error)
    // Fallback estimation
    const totalText = messages.map(m => m.role + m.content).join('')
    return Math.ceil(totalText.length / 4)
  }
}