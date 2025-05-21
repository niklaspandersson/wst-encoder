# Node client library for the NEWFOR protocol
NXT issue: https://github.com/nxtedition/nxt/issues/10175

## Usage

1. Create an instance of the NewforEncoder
    ```javascript
    import NewforEncoder from './newfor-encoder.js'
    const newfor = new NewforEncoder(stream)  // stream is a writable stream
    ```

2. "Initiera live mode"
    ```javascript
    newfor.setSubtitlePage(page)    // page is the wanted page, 399 in the captures
    newfor.setSubtitlePage(0)       // don't know why or if this is needed
    ```

3. Set and display subtitles
    ```javascript
    newfor.setBuffer(["row 1", "row 2"])    // Captures have examples of 1 or 2 rows. Word wrapping should be done before passing the rows to the encoder. Rows should not be longer that 35 characters
    newfor.display()                        // This is the command that actually displays the set buffer
    ```

4. Hide subtitles
    ```javascript
    newfor.hide()       // hides the subtitles
    ```

5. Shutdown
    ```javascript
    newfor.hide() 
    newfor.setSubtitlePage(999)     // this indicates that subtitling is to be terminated
    ```

## Resources
* Protocol specs: https://code.google.com/archive/p/vbit/wikis/NewforSubtitles.wiki
* Server code: https://github.com/peterkvt80/vbit2/blob/master/newfor.h
* Client code: https://github.com/peterkvt80/newfor-subtitles/blob/master/newfor.pde
* Hamming encoding reference: https://pdc.ro.nu/hamming.html
* Texetext specs: https://www.etsi.org/deliver/etsi_en/300700_300799/300706/01.02.01_60/en_300706v010201p.pdf
* Teletext wiki: https://teletext.wiki.zxnet.co.uk/wiki/Teletext_packets
* Teletext char sets: https://en.wikipedia.org/wiki/Teletext_character_set


## Messages

### Type 2 (Set Subtitle Buffer)

__Spec Says:__
* 0x8F, 8 x Clearbit + No. of subtitle rows
* Hamming encoded
* Each row of subtitle information consists of:
* top 4 bits of row No, bottom Top 4 bits of row No, 40 data bytes
* Hamming Encoded (Binary)

__Recording have__
* 0x8F 0x47 <- apparently "8x clearbit + No. of subtitle rows"
* 0x02 0x38 (Hamming encoded) -> 0x01, 0x06 = 0x16 = 22 (resonable row no.)
* Following is 40 bytes of data:
    * 0x20 0x20 0x20 0x20 0x20 0x20 0x20 0x20 0x20 0x20 0x20 (11 spaces.)
    * 0x0d 0x07 0x0b 0x0b (4 control characters. "double height", "Alpha white alphabetic, white foreground", "start box", "start box")
    * 0x54 0xf4 0xf4 0x20 0xf4 0xe5 0x73 0xf4 0xae ("Ttt test." Using sk 'odd parity')
    * 0x8a 0x8a ("end box", "end box". Using odd parity)
    * 0x20 0x20 0x20 0x20 0x20 0x20 0x20 0x20 0x20 0x20 0x20 0x20 0x20 0x20 (14 spaces.)