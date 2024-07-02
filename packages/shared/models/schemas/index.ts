export * from './base.schema';
export * from './chain.schema';
export * from './user.schema';
export * from './lottery.schema';
export * from './ticket.schema';
export * from './block.schema';
export * from './starkflip.schema';

export async function retryUntil<T>(
  operation: () => Promise<T>,
  condition: (result: T) => boolean,
  maxAttempts: number = 5,
  delay: number = 1000,
): Promise<T | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await operation();
      if (condition(result)) {
        return result;
      }

      // Wait for a specified delay before next attempt
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error, error.track);

      // Wait for a specified delay before next attempt
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed after ${maxAttempts} attempts`);
  // return null; // Indicate failure after all attempts
}
