export interface LoginFormData {
  username: string;
  password: string;
}

export interface LoginResponse {
  success?: boolean;
  error?: string;
  redirect?: string;
}
