import { describe, it, expect } from '@jest/globals';

import { hammingDecodeTripple, hammingEncode24 } from "./parity";
import { packEnhancement } from "./x26-encoder";
import { bitmask } from './bit-utils';

describe('X26 encoder/decoder', () => {
  function decodeX26Tripplet(tripplet) {
    const value = hammingDecodeTripple(tripplet);
    const address = value & bitmask(6);
    const mode = (value & (bitmask(5) << 6)) >> 6;
    const data = (value & (bitmask(7) << 11)) >> 11;

    return { mode, address, data };
  }

  it.skip.each([
    ["set active position", 0x79, 0x93, 0x00],
    ["character from the G2 set", 0x02, 0x3d, 0x61],
    ["character from the G2 set", 0x0d, 0xbd, 0x69],
    ["character from the G2 set", 0x15, 0xbd, 0x71],
    ["character from the G2 set", 0x29, 0x3d, 0x79],
    ["termination 'space-filler'", 0x74, 0xff, 0x80],
    ["termination 'final'", 0x74, 0x7f, 0xff]
  ])('decodes X26 tripplets', (desc, ...tripplet) => {
    const data = decodeX26Tripplet(tripplet);
    console.log(desc, data);
    // 0x79, 0x93, 0x00,  // row address "Set active position", row 22
    // 0x02, 0x3d, 0x61,  // column address "Character from the G2 set", address 16, data 0x61
    // 0x0d, 0xbd, 0x69,  // column address "Character from the G2 set", address 17, data 0x69
    // 0x15, 0xbd, 0x71,  // column address "Character from the G2 set", address 19, data 0x71
    // 0x29, 0x3d, 0x79,  // column address "Character from the G2 set", address 20, data 0x79
    // 0x74, 0xff, 0x80,  // termination "Space-filler"
    // 0x74, 0x7f, 0xff   // termination "Final"
  });

  it.each([
    { mode: 0x0f, address: 16, data: 0x61, expected: [0x02, 0x3d, 0x61] },
    { mode: 0x0f, address: 20, data: 0x79, expected: [0x29, 0x3d, 0x79] },
    { mode: 0x1f, address: 0x3f, data: 0x0, expected: [0x74, 0xff, 0x80] },
    { mode: 0x1f, address: 0x3f, data: 0xff, expected: [0x74, 0x7f, 0xff] }
  ])("packs and encodes X26 enhancements using hamming24/18 tripplets", (data) => {
    //Arrange

    //Act
    const value = packEnhancement(data.mode, data.address, data.data);
    const result = hammingEncode24(value);

    //Assert
    expect(result).toEqual(data.expected);
  });
});