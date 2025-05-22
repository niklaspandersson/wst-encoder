import { Buffer } from 'node:buffer';
import { describe, it, expect } from '@jest/globals';

import WSTEncoder from './wst-encoder.js';

describe('WSTEncoder', () => {
  describe('encoders', () => {

    it('encodeSubtitle', () => {
      // Arrange
      const encoder = new WSTEncoder();

      // Act
      // https://zxnet.co.uk/teletext/editor/#0:QIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECAWLnadezDzQd8PNBoy8sooUgQIECBAgQIECBAgQIECBAgQIBYubh16d2dBh3b-mjLyQct_dB00YeiDTzQbN-7Pl5ChSBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECA:PS=401e:RE=0:zx=Uc00:PN=801:SC=0
      const res = encoder.encodeSubtitle(['Niklas was here', 'Making another row that is longer']);

      for (const data of res) {
        const buf = Buffer.from(data);
        console.log(buf);
        console.log(buf.toString('base64'));
      }
      //Assert
      expect(res.length).toEqual(3);
    });

    it('encodeDummy', () => {
      // Arrange
      const encoder = new WSTEncoder();

      // Act
      const res = encoder.encodeDummy();

      for (const data of res) {
        const buf = Buffer.from(data);
        console.log(buf);
        console.log(buf.toString('base64'));
      }
      //Assert
      expect(res.length).toEqual(1);
    });
  })
});