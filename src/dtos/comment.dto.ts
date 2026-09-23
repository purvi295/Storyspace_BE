export interface CreateCommentDto {
  content: string;
}

export interface UpdateCommentDto {
  content: string;
}

export interface CommentQueryDto {
  page?: number;
  limit?: number;
}
