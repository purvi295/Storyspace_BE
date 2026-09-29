/** Data accepted when creating a public account. */
export interface RegisterDto {
  email: string;
  password: string;
  username: string;
  full_name: string;
}

/** Credentials accepted by the login endpoint. */
export interface LoginDto {
  email: string;
  password: string;
}
