/**
 * Extracts the i-th bit from a number
 * @param {number} n value to get the i-th bit from
 * @param {*} i which bit to get
 * @returns 1 if the i-th bit is set, 0 otherwise
 */
export function bit(n, i) {
  return (n & (1 << i)) >> i;
}

/**
 * Creates a bitmask with the lowest size bits set to 1
 * @param {number} size The number of bits to set
 * @returns {number} A bitmask with the lowest size bits set to 1, e.g. 0b00001111 for size = 4
 */
export function bitmask(size) {
  return (1 << size) - 1;
}

/**
 * Creates a byte from a list of bits
 * @param  {...number} bits 
 * @returns {number} A byte with the bits set as specified in the arguments, e.g. byte(1, 0, 0, 1) => 0b1001
 */
export function byte(...bits) {
  return bits.reduce((acc, bit, i) => acc | (bit << i), 0);
}