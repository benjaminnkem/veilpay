import { ManifestService } from './manifest.service';

describe('ManifestService cross-language vector', () => {
  it('matches the canonical Solidity ABI vector', () => {
    const hash = new ManifestService().hash({
      chainId: 11155111n,
      payrollContract: '0x1111111111111111111111111111111111111111',
      token: '0x2222222222222222222222222222222222222222',
      treasury: '0x3333333333333333333333333333333333333333',
      payrollId:
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      recipients: [
        '0x4444444444444444444444444444444444444444',
        '0x5555555555555555555555555555555555555555',
      ],
      handles: [
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      ],
      deadline: 2000000000n,
    });
    expect(hash).toBe(
      '0x0f914af5948c691e99b65b2fc6ca1deb508b751fa69a923cee83706717d60e54',
    );
  });
});
