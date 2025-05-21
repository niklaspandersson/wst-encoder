import { applyParity, hammingEncodeByte, hammingEncodeNybble } from "./parity.js";
import X26Encoder from "./x26-encoder.js";
/**
 * @typedef {import('stream').Writable} WriteStream
 */

const spaces = n => Array(n).fill(' ').join('');
const Padding = spaces(40);

export default class WSTEncoder {

  #magazine = 0;  // valid values are 0-7, where 0 is interpreted as 8
  #page = 0x01;   // valid values are 0x00-0xFF

  constructor() {
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

  #encodeHeaderPacket({ magazine, page, erase = 1 }) {
    const header = this.#encodePrefix(magazine, 0);
    
    const pageUnits = page & 0xF; // (9.3.1.1)
    const pageTens = (page >> 4) & 0xF; // (9.3.1.1)
    
    // page sub-code (9.3.1.2) 
    // We're assuming page sub-code is 0000 for now
    let s1 = 0;
    let s2 = 0;
    let s3 = 0;
    let s4 = 0;

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

    const chars = Uint8Array.from(Array(n32).fill(0x20)); // 32 spaces of padding. 0x20 have odd parity, so no need to apply parity
    return Uint8Array.from(...header, ...pageControls, ...chars);
  }

  #encodeDisplayPacket(row, text) {
    //TODO: implement this 
    return Uint8Array.from([0x00])
  }

  /**
   * 
   * @param {number} startLine 
   * @param {string[]} rows 
   * @returns 
   */
  encode(startLine, rows) {
    // Encode header
    const headerPacket = this.#encodeHeaderPacket({
      magazine: this.#magazine,
      page: this.#page,
      erase: 1
    });

    if(!rows?.length)
      return [headerPacket];

    // Encode display rows, this will also create any needed enhancement packets
    const rowPackets = this.#encodeDisplayRows(startLine, rows);

    return [headerPacket, ...rowPackets];
  }

  /**
   * @param {number} startRow On which row to start displaying the text
   * @param {string[]} rows The rows of text to display
   */
  #encodeDisplayRows(startRow, rows) {
    // apply character encoding
    const x26encoder = new X26Encoder();
    const rowData = rows.map((row, i) => x26encoder.encodeRow(row, startRow + i));

    const rowPackets = rowData.map((data, i) => {
      const prefix = this.#encodePrefix(this.#magazine, startRow + i);
      const payload = applyParity(data);

      return Uint8Array.from(...prefix, ...Uint8Array.from(payload));
    });

    const enhancementPackets = x26encoder.enhancementPackets.map((enhancement) => {
      const prefix = this.#encodePrefix(this.#magazine, 26);

      return Uint8Array.from(...prefix, ...enhancement);
    });

    return [...enhancementPackets, ...rowPackets];
  }
}
