import { renderEmail, type EmailJobPayload } from './email-delivery.service';

const render = (
  template: EmailJobPayload['template'],
  variables: Record<string, string>,
) =>
  renderEmail(
    { to: 'employee@example.com', template, variables },
    'https://app.veilpay.example',
  );

function linkFromText(text: string): URL {
  const value = text.slice(text.indexOf('https://'));
  return new URL(value);
}

describe('renderEmail', () => {
  it('renders verification and password-reset links', () => {
    const verification = linkFromText(
      render('verify-email', { token: 'verify token' }).text,
    );
    const reset = linkFromText(
      render('reset-password', { token: 'reset token' }).text,
    );

    expect(verification.pathname).toBe('/verify-email');
    expect(verification.searchParams.get('token')).toBe('verify token');
    expect(reset.pathname).toBe('/reset-password');
    expect(reset.searchParams.get('token')).toBe('reset token');
  });

  it.each([
    ['sign-in', '/sign-in'],
    ['sign-up', '/sign-up'],
  ])(
    'routes an invitation through %s with the acceptance redirect',
    (entrypoint, pathname) => {
      const invitation = render('invitation', {
        token: 'invite token',
        entrypoint,
      });
      const url = linkFromText(invitation.text);

      expect(url.pathname).toBe(pathname);
      expect(url.searchParams.get('redirect_uri')).toBe(
        '/invitation/accept?token=invite+token',
      );
      expect(invitation.html).toContain('Accept invitation');
    },
  );
});
