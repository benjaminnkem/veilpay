import { Injectable } from '@nestjs/common';
import {
  encodeAbiParameters,
  getAddress,
  keccak256,
  parseAbiParameters,
  type Address,
  type Hex,
} from 'viem';
export interface ManifestInput {
  chainId: bigint;
  payrollContract: Address;
  token: Address;
  treasury: Address;
  payrollId: Hex;
  recipients: Address[];
  handles: Hex[];
  deadline: bigint;
}
@Injectable()
export class ManifestService {
  readonly version = 1;
  hash(m: ManifestInput): Hex {
    return keccak256(
      encodeAbiParameters(
        parseAbiParameters(
          'uint16, uint256, address, address, address, bytes32, address[], bytes32[], uint256, uint48',
        ),
        [
          this.version,
          m.chainId,
          getAddress(m.payrollContract),
          getAddress(m.token),
          getAddress(m.treasury),
          m.payrollId,
          m.recipients.map(getAddress),
          m.handles,
          BigInt(m.recipients.length),
          Number(m.deadline),
        ],
      ),
    );
  }
}
