import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { network } from 'hardhat';

const { viem } = await network.create();
const publicClient = await viem.getPublicClient();
const chainId = await publicClient.getChainId();
const directory = new URL(
  `../ignition/deployments/chain-${chainId}/`,
  import.meta.url,
);
const addresses = JSON.parse(
  await readFile(new URL('deployed_addresses.json', directory), 'utf8'),
) as Record<string, string>;
const journal = (await readFile(new URL('journal.jsonl', directory), 'utf8'))
  .trim()
  .split('\n')
  .map(
    (line) =>
      JSON.parse(line) as {
        type: string;
        futureId?: string;
        hash?: string;
        receipt?: { blockNumber: number; contractAddress: string };
      },
  );
const deployments = journal
  .filter((entry) => entry.type === 'TRANSACTION_CONFIRM')
  .map((entry) => ({
    id: entry.futureId,
    address: entry.receipt?.contractAddress,
    transactionHash: entry.hash,
    blockNumber: entry.receipt?.blockNumber,
  }));
const output = {
  chainId,
  generatedAt: new Date().toISOString(),
  addresses,
  deployments,
};
const outputDirectory = new URL('../deployments/', import.meta.url);
await mkdir(outputDirectory, { recursive: true });
await writeFile(
  new URL(`${chainId}.json`, outputDirectory),
  `${JSON.stringify(output, null, 2)}\n`,
);
console.log(`Wrote deployments/${chainId}.json`);
