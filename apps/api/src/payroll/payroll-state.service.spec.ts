import { PayrollStateService } from './payroll-state.service';
describe('PayrollStateService', () => {
  const state = new PayrollStateService();
  it('permits the happy path', () => {
    expect(state.can('DRAFT', 'PREPARING')).toBe(true);
    expect(state.can('PREPARING', 'PREPARED')).toBe(true);
    expect(state.can('PROPOSED', 'SAFE_APPROVED')).toBe(true);
    expect(state.can('EXECUTING', 'EXECUTED')).toBe(true);
  });
  it('rejects replay and invalid skips', () => {
    expect(() => state.assert('EXECUTED', 'EXECUTING')).toThrow(
      'Cannot transition',
    );
    expect(() => state.assert('DRAFT', 'EXECUTED')).toThrow(
      'Cannot transition',
    );
  });
});
