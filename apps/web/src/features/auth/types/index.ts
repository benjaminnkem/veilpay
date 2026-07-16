export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  organizationName: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}
