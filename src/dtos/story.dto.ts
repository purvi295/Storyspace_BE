export interface CreateStoryDto {
  title: string;
  content: string;
  slug?: string; // Optional - will be auto-generated from title if not provided
  summary: string;
  coverImageUrl?: string;
  status?: string;
  visibility?: string;
}

export interface UpdateStoryDto {
  title?: string;
  content?: string;
  summary?: string;
  coverImageUrl?: string;
  status?: string;
  visibility?: string;
  slug?: string;
}

export interface StoryQueryDto {
  page?: number;
  limit?: number;
  status?: string;
  visibility?: string;
  author?: string;
}
