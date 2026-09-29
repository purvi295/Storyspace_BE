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

/** Fields a signed-in user may update through /api/auth/edit-profile. */
export interface EditAuthProfileDto {
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  username?: string;
}
