export interface Tag {
  id: number;
  name: string;
  color?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface TagWithStats extends Tag {
  videoCount?: number;
  watchedCount?: number;
  completionRate?: number;
}