import { NoxService } from './nox.service';
describe('NoxService explicit test adapter', () => {
  beforeAll(() => {
    process.env.NOX_MODE = 'test';
    process.env.NODE_ENV = 'test';
  });
  it('is deterministic and application-contract bound', async () => {
    const chain = { chainId: 31337 } as never;
    const nox = new NoxService(chain);
    const a = await nox.encryptAmount(
      100n,
      '0x1111111111111111111111111111111111111111',
    );
    const b = await nox.encryptAmount(
      100n,
      '0x1111111111111111111111111111111111111111',
    );
    const c = await nox.encryptAmount(
      100n,
      '0x2222222222222222222222222222222222222222',
    );
    expect(a).toEqual(b);
    expect(a.handle).not.toEqual(c.handle);
    expect(a.handle).toMatch(/^0x[0-9a-f]{64}$/);
  });
  it('rejects non-positive inputs', async () => {
    const nox = new NoxService({ chainId: 31337 } as never);
    await expect(
      nox.encryptAmount(0n, '0x1111111111111111111111111111111111111111'),
    ).rejects.toThrow('positive');
  });
});
