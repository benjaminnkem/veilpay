import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

export default buildModule('VeilPayPayrollModule', (m) => {
  const mockUsdc = m.contract('MockUSDC');
  const confidentialUsdc = m.contract('ConfidentialUSDC', [mockUsdc]);
  const testConfidentialUsdc = m.contract('TestConfidentialUSDC', [], {
    id: 'TestConfidentialUSDCV2',
  });
  const payroll = m.contract('ConfidentialPayroll', [20n], {
    id: 'ConfidentialPayrollV3',
  });

  return { mockUsdc, confidentialUsdc, testConfidentialUsdc, payroll };
});
