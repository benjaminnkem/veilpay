export const payrollAbi = [
  {
    type: 'function',
    name: 'approvePayroll',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'payrollId', type: 'bytes32' },
      { name: 'manifestHash', type: 'bytes32' },
      { name: 'token', type: 'address' },
      { name: 'itemCount', type: 'uint32' },
      { name: 'deadline', type: 'uint48' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'executePayroll',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'treasury', type: 'address' },
      { name: 'payrollId', type: 'bytes32' },
      { name: 'token', type: 'address' },
      { name: 'recipients', type: 'address[]' },
      { name: 'encryptedAmountHandles', type: 'bytes32[]' },
      { name: 'inputProofs', type: 'bytes[]' },
      { name: 'deadline', type: 'uint48' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'cancelPayroll',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'payrollId', type: 'bytes32' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getApproval',
    stateMutability: 'view',
    inputs: [
      { name: 'treasury', type: 'address' },
      { name: 'payrollId', type: 'bytes32' },
    ],
    outputs: [
      {
        name: 'approval',
        type: 'tuple',
        components: [
          { name: 'manifestHash', type: 'bytes32' },
          { name: 'token', type: 'address' },
          { name: 'itemCount', type: 'uint32' },
          { name: 'deadline', type: 'uint48' },
          { name: 'status', type: 'uint8' },
        ],
      },
    ],
  },
  {
    type: 'event',
    name: 'PayrollExecuted',
    inputs: [
      { indexed: true, name: 'treasury', type: 'address' },
      { indexed: true, name: 'payrollId', type: 'bytes32' },
      { indexed: true, name: 'manifestHash', type: 'bytes32' },
      { indexed: false, name: 'itemCount', type: 'uint256' },
    ],
  },
] as const;
export const tokenAbi = [
  {
    type: 'function',
    name: 'setOperator',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'until', type: 'uint48' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'isOperator',
    stateMutability: 'view',
    inputs: [
      { name: 'holder', type: 'address' },
      { name: 'operator', type: 'address' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'confidentialBalanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'faucet',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;
