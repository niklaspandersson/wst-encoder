import { bitmask } from "./bit-utils.js";
import { hammingEncode24, hammingEncodeNybble } from "./parity.js";

const G0_swedish_subset = {
  '#': '#',
  '¤': '¤',
  'É': '@',
  'Ä': '[',
  'Ö': '\\',
  'Å': ']',
  'Ü': '^',
  '_': '_',
  'é': '`',
  'ä': '{',
  'ö': '|',
  'å': '}',
  'ü': '~'
}
const G0_english_subset = {
  '£': '#',
  '$': '¤',
  '@': '@',
  '←': '[',   // left arrow 
  '½': '\\',  // 1/2
  '→': ']',   // right arrow
  '↑': '^',   // up arrow
  '#': '_',
  '—': '`',   // long dash
  '¼': '{',   // 1/4
  '‖': '|',   // double pipe
  '¾': '}',   // 3/4
  '÷': '~'    // division symbol
}

const G2_latin = ['\x00', '¡', '¢', '£', '$', '¥', '#', '§', '¤', '‘', '“', '«', '←', '↑', '→', '↓', // 2x
  '°', '±', '²', '³', '×', 'µ', '¶', '·', '÷', '’', '”', '»', '¼', '½', '¾', '¿', // 3x
  '\x00', '\x00', '\x00', '\x00', '\x00', '\x00', '\x00', '\x00', '\x00', '\x00', '\x00', '\x00', '\x00', '\x00', '\x00', '\x00', // 4x (should be Diacritical marks for use with G0 characters)
  '─', '¹', '®', '©', '™', '♪', '₠', '‰', 'α', '\x00', '\x00', '\x00', '⅛', '⅜', '⅝', '⅞', // 5x
  'Ω', 'Æ', 'Ð', 'ª', 'Ħ', '\x00', 'Ĳ', 'Ŀ', 'Ł', 'Ø', 'Œ', 'º', 'Þ', 'Ŧ', 'Ŋ', 'ŉ', // 6x
  'ĸ', 'æ', 'đ', 'ð', 'ħ', 'ı', 'ĳ', 'ŀ', 'ł', 'ø', 'œ', 'ß', 'þ', 'ŧ', 'ŋ', '■'  // 7x
];
const G2_latin_replacements = [' ', ' ', ' ', ' ', ' ', ' ', '#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', // 2x
  ' ', ' ', '2', '3', 'x', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', // 3x
  ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', // 4x (should be Diacritical marks for use with G0 characters)
  '-', '1', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', // 5x
  'O', 'A', 'D', ' ', ' ', ' ', ' ', ' ', ' ', 'O', 'O', ' ', ' ', ' ', ' ', ' ', // 6x
  'K', 'a', 'd', 'd', ' ', ' ', ' ', ' ', ' ', 'o', 'o', 's', 'p', ' ', ' ', '\x7f'  // 7x
];

const Mode = Object.freeze({
  SetActivePosition: 0x04,
  G2Character: 0x0F,
  TerminationMarker: 0x1F
});

export function packEnhancement(mode, address, data) {
  return (address & bitmask(6)) | ((mode & bitmask(5)) << 6) | ((data & bitmask(7)) << 11);
};

export default class X26Encoder {

  #enhancements = [];

  /**
   * @param {number} packetNumber
   * @param {Array<{mode: number, address: number, data: number}} enhancements
   * @returns A full X26 packet containing the enhancements
   */
  #encodeX26Packet(packetNumber, enhancements) {
    const result = [hammingEncodeNybble(packetNumber)];

    for (const enhancement of enhancements) {
      const value = packEnhancement(enhancement.mode, enhancement.address, enhancement.data);
      result.push(...hammingEncode24(value));
    }

    // Fill up to 13 enhancements with termination markers
    if (enhancements.length < 13) {
      const fillers = 13 - enhancements.length;
      for (let i = 1; i <= fillers; i++) {
        result.push(...hammingEncode24(packEnhancement(Mode.TerminationMarker, 0x3f, i === fillers ? 0xff : 0x00)));
      }
    }

    return result;
  }

  /**
   * Applies character encoding to a row of text, while keeping track of the enhancements needed
   * @param {string} str The row to apply character encoding to
   * @param {number} rowLocation The location of the row on the screen
   * @returns {string} The row with character encoding applied
   */
  encodeRow(str, rowLocation) {
    const row = Array.from(str);
    let firstRowEnhancement = true;

    for (let j = 0; j < row.length; j++) {
      const char = row[j];
      if (G0_english_subset[char]) {
        row[j] = G0_english_subset[char];
      } else if (G2_latin.includes(char)) {
        const char_index = G2_latin.indexOf(char);
        row[j] = G2_latin_replacements[char_index];
        if (firstRowEnhancement) {
          this.#enhancements.push({ mode: Mode.SetActivePosition, address: 40 + (rowLocation === 24 ? 0 : rowLocation), data: 0 });
          firstRowEnhancement = false;
        }
        this.#enhancements.push({ mode: Mode.G2Character, address: j, data: char_index + 0x20 });
      }
    }
    return row.join('');
  }

  /**
   * @returns {number[][]} A list of x26 packets, containing all enhancements needed for the encoded rows
   */
  get enhancementPackets() {
    return this.#packets ?? (this.#packets = this.#generatePackets());
  }

  #packets;
  #generatePackets() {
    const rowsNeeded = Math.ceil(this.#enhancements.length / 13);

    const result = [];
    for (let i = 0; i < rowsNeeded; i++) {
      const slice = this.#enhancements.slice(Math.min(i * 13, this.#enhancements.length), Math.min((i + 1) * 13, this.#enhancements.length));
      result.push(this.#encodeX26Packet(i, slice));
    }
    return result;
  }
};
