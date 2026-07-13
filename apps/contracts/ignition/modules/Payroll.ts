import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

export default buildModule('VeilPayPayrollModule', (m) => {
  const mockUsdc = m.contract('MockUSDC');
  const confidentialUsdc = m.contract('ConfidentialUSDC', [mockUsdc]);
  const testConfidentialUsdc = m.contract('TestConfidentialUSDC');
  const payroll = m.contract('ConfidentialPayroll', [20n]);

  return { mockUsdc, confidentialUsdc, testConfidentialUsdc, payroll };
});
