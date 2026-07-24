export type Role = "client" | "tasker";

export type Session = {
  role: Role;
  token: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  savedAt?: number;
};

export type LoginResponse = {
  access_token: string;
  token_type?: string;
};

export type UserRegistration = {
  email: string;
  password: string;
  full_name: string;
  role: Role;
};

export type Credentials = {
  email: string;
  password: string;
};
