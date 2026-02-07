/**
 * Turn an array of strings into an array of valid BigInt's.
 */
export function stringArrayToBigInt(array: string[]): bigint[] {
  return array
    .map((value) => {
      try {
        return BigInt(value);
      } catch (error) {
        // Ignore
      }
    })
    .filter((value) => value !== undefined);
}
