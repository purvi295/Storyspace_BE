/** Fields a signed-in user may update through /api/users/profile. */
export interface UpdateUserProfileDto {
  full_name?: string;
  bio?: string;
  avatar_url?: string;
}
