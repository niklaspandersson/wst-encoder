import { applyParity, hammingEncodeNybble } from "./parity.js";
import X26Encoder from "./x26-encoder.js";
/**
 * @typedef {import('stream').Writable} WriteStream
 */

const spaces = n => Array(n).fill(' ').join('');

export default class WSTEncoder {

  #magazine = 0;  // valid values are 0-7, where 0 is interpreted as 8
  #page = 0x01;   // valid values are 0x00-0xFF
  #startRow; // valid values are 0-31
  #doubleHeight; // valid values are true or false

  constructor({ startRow = 19, doubleHeight = false, magazine = 0, page = 0x01 } = {}) {
    this.#magazine = magazine;
    this.#page = page;
    this.#startRow = startRow;
    this.#doubleHeight = doubleHeight;
  };

  #encodePrefix(magazine, packet) {
    
    // encode packet address (7.1.2)
    const x = magazine & 0x07;
    const y = packet & 0x1F;
    const byte4 = hammingEncodeNybble(x + ((y & 1) << 3))
    const byte5 = hammingEncodeNybble(y >> 1);

    return Uint8Array.from([
      0x55, 0x55, //clock run-in (6.1)
      0x27,       //framing code (6.2)
      byte4,      // packet address
      byte5,      // packet address
    ]);
  }

  #encodeHeaderPacket({ magazine, page, pageSubCode = 0, erase = 1 } = {}) {
    const header = this.#encodePrefix(magazine, 0);
    
    const pageUnits = page & 0xF; // (9.3.1.1)
    const pageTens = (page >> 4) & 0xF; // (9.3.1.1)
    
    // page sub-code (9.3.1.2) 
    let s1 = pageSubCode & 0xF;
    let s2 = (pageSubCode >> 4) & 0x7;
    let s3 = (pageSubCode >> 8) & 0xF;
    let s4 = (pageSubCode >> 12) & 0x3;

    // control bits (9.3.1.3)
    if(erase) {
      s2 |= (1 << 3); // erase page: control-bit C4
    }

    s4 |= (1 << 3);   // subtitle: control-bit C6

    let cb1 = 0;  
    cb1 |= 1          // suppress header: control-bit C7
    cb1 |= (1 << 1);  // update indicator: control-bit C8
    
    let cb2 = 0;      // C11 = 0 indicating "parallel mode", C12-C14 = 0 indicating english character set

    const pageControls = Uint8Array.from([pageUnits, pageTens, s1, s2, s3, s4, cb1, cb2].map(nybble => hammingEncodeNybble(nybble & 0xF)));

    const chars = Uint8Array.from(Array(32).fill(0x20)); // 32 spaces of padding. 0x20 have odd parity, so no need to apply parity
    return Uint8Array.from([...header, ...pageControls, ...chars]);
  }

  encodeDummy() {
    const headerPacket = this.#encodeHeaderPacket({
      magazine: this.#magazine,
      page: 0xFF,
      pageSubCode: 0x3F7E,
      erase: 0
    });

    return [headerPacket];
  }

  /**
   * TODO: Add support for double height
   * TODO: Add support for horizontal alignment
   * @param {number} startLine 
   * @param {string[]} rows 
   * @returns 
   */
  encodeSubtitle(rows, { startRow = this.#startRow } = {}) {
    // Encode header
    const headerPacket = this.#encodeHeaderPacket({
      magazine: this.#magazine,
      page: this.#page,
      erase: 1
    });

    if(!rows?.length)
      return [headerPacket];

    // Encode display rows, this will also create any needed enhancement packets
    const rowPackets = this.#encodeDisplayRows(startRow, rows);

    return [headerPacket, ...rowPackets];
  }

  /**
   * @param {number} startRow On which row to start displaying the text
   * @param {string[]} rows The rows of text to display
   */
  #encodeDisplayRows(startRow, rows) {
    // apply character encoding
    const textEncoder = new TextEncoder();
    const x26encoder = new X26Encoder();

    const rowPackets = rows.map((text, i) => {
      const prefix = this.#encodePrefix(this.#magazine, startRow + i);

      // encode text by padding to 40 chars, applying x26 ehancements and parity
      const boxedText = `\x0b\x0b${text}\x0a\x0a${spaces(40-text.length)}`.substring(0, 40);
      const textData = x26encoder.encodeRow(boxedText, startRow + i);
      const textBytes = textEncoder.encode(textData);
      const payload = applyParity(textBytes);

      return Uint8Array.from([...prefix, ...payload]);
    });

    // create full x26 packets for all enhancements
    const enhancementPackets = x26encoder.enhancementPackets.map((enhancement) => {
      const prefix = this.#encodePrefix(this.#magazine, 26);
      return Uint8Array.from([...prefix, ...enhancement]);
    });

    // return enhanmentment packets first, according to best practices
    return [...enhancementPackets, ...rowPackets];
  }
}
