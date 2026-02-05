class SnowflakeGenerator {
  // The worker ID for this generator.
  worker_id: number;

  // The current sequence number for this generator. Goes up to 4095 and then wraps around.
  current_seq: number = 0;

  /**
   * Create a new snowflake generator with a provided worker ID.
   */
  constructor(worker_id: number) {
    this.worker_id = worker_id;
  }

  /**
   * Increment the sequence number for this generator, returning the previous sequence number.
   */
  incrementSeq(): number {
    // Store current sequence number.
    const current = this.current_seq;

    // Increment sequence number and wrap around, if necessary.
    this.current_seq++;
    if (this.current_seq >= 4096) {
      this.current_seq = 0;
    }

    // Return previous sequence number.
    return current;
  }

  /**
   * Generate a new snowflake ID using this generator.
   */
  generate(): bigint {
    // Get sequence number
    const seq_number = BigInt(this.incrementSeq());

    // Get UNIX timestamp, in milliseconds.
    const timestamp = BigInt(new Date().valueOf());

    // Construct snowflake ID
    let id = 0n;
    id |= (timestamp & 0x3ffffffffffn) << 21n;
    id |= (BigInt(this.worker_id) & 0x1ffn) << 12n;
    id |= seq_number & 0xfffn;

    // Return snowflake ID
    return id;
  }
}

/**
 * Deconstruct a snowflake into its components.
 * @param snowflake The snowflake to deconstruct.
 */
function deconstructSnowflake(snowflake: bigint) {
  // Break down pieces of ID
  const timestamp = (snowflake & 0x7fffffffffe00000n) >> 21n;
  const worker_id = (snowflake & 0x1ff000n) >> 12n;
  const sequence_number = snowflake & 0xfffn;

  // Turn timestamp into a date object
  const creation_date = new Date(Number(timestamp));

  // Return deconstructed snowflake
  return { creation_date, worker_id, sequence_number };
}

// Initialise a snowflake generator for the application.
export const generator = new SnowflakeGenerator(0);
export default generator;
