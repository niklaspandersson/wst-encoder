import { applyParity, hammingEncodeByte, hammingEncodeNybble } from "./parity.js";
import X26Encoder from "./x26-encoder.js";
/**
 * @typedef {import('stream').Writable} WriteStream
 */

const spaces = n => Array(n).fill(' ').join('');
const Padding = spaces(40);

export default class WSTEncoder {
  /**
   * Write the given bytes to the stream
   * @param {number[]|Uint8Array} bytes
   */
  #write(bytes) {
    // this.#stream.write(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));
  }

  #magazine = 7;  //valid values are 1-8
  #page = 0x99; //valid values are 0x00-0xFF

  constructor() {
  };

  #encodePrefix(magazine, packet) {
    const x = magazine & 0x07;
    const y = packet & 0x1F;

    const byte4 = hammingEncodeNybble(x + ((y & 1) << 3))
    const byte5 = hammingEncodeNybble(y >> 1);
    return Uint8Array.from([
      0x55,
      0x55,
      0x27,
      byte4,
      byte5,
    ]);
  }
  #encodeHeaderPacket({ magazine, page, subCode }) {
    const header = this.#encodePrefix(magazine, 0);
    // Additional header encoding logic here
    return header;
  }
  #encodeDisplayPacket(row, text) { }

  encode(startLine, rows) {
    // Encode header
    const headerPrefix = this.#encodePrefix(this.#magazine, 0);


    // Encode text
  }

  /**
   * Encode the Set Subtitle Page command and write it to the stream
   * @param {number} page Which page to set, 000-999
   */
  setSubtitlePage(page) {
    const units = page % 10;
    const tens = Math.floor(page / 10) % 10;
    const hundreds = Math.floor(page / 100) % 10;

    this.#write(([applyParity(0x0E), hammingEncodeNybble(0), hammingEncodeNybble(hundreds), hammingEncodeNybble(tens), hammingEncodeNybble(units)]));
  }

  /**
   * Encode the Set Subtitle Buffer command using the given rows of text, and write them to the stream.
   * For a row to be displayed completely, it must not be longer than 35 characters.
   * @param {string[]} rows The rows of text to display
   * @param {boolean} clear Whether to clear the screen before displaying the text
   */
  setBuffer(rows, clear = true) {
    const startRow = 24 - rows.length * 2;

    /**
    * decorate row with teletext control codes and some extra padding at the end
    *
    * Teletext control codes as specified here https://en.wikipedia.org/wiki/Videotex_character_set#C1_control_codes
    * 0x0d = "double height"
    * 0x07 = "alphabetic, white foreground"
    * 0x0b = "start box"
    * 0x0a = "end box"
    *
    * The usage of these is based on captured data.
    */
    let rowData = rows.map(row => `\x0d\x07\x0b\x0b${row}\x0a\x0a`);

    // pad rows to 40 characters, applying the same left padding to all rows
    const maxRowLength = Math.max(...rowData.map(row => row.length));
    const paddingLeft = Math.floor(Math.max(38 - maxRowLength, 0) / 2);
    rowData = rowData.map(row => (Padding.substring(0, paddingLeft) + row + Padding).substring(0, 40));

    // apply character encoding
    const x26encoder = new X26Encoder();
    rowData = rowData.map((row, i) => x26encoder.applyEncoding(row, startRow + 2 * i));

    // write header
    const header = hammingEncodeNybble((rowData.length + x26encoder.packets.length) + (clear ? 0x08 : 0x00)) & 0x7F;
    this.#write([applyParity(0x0F), header]); // Set buffer command

    // write enhancement packets
    for (const packet of x26encoder.packets) {
      this.#write(hammingEncodeByte(26).map(byte => byte & 0x7F));
      this.#write(packet);
    }

    // write row data
    const textencoder = new TextEncoder();
    for (let rowIndex = 0; rowIndex < rowData.length; ++rowIndex) {
      const data = rowData[rowIndex];
      const rowLocation = startRow + 2 * rowIndex;
      this.#write(hammingEncodeByte(rowLocation));
      this.#write(applyParity(textencoder.encode(data)))
    }
  }
}
