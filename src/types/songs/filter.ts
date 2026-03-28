export interface FilterParams {
  difficulty?: string;
  level?: number;
  clearState?: string;
  bpiMin?: number;
  bpiMax?: number;
  version?: string;
  bpmMin?: number;
  bpmMax?: number;
  isSofran?: boolean;
  notesMin?: number;
  notesMax?: number;
  search?: string;
  sortKey?: string;
  sortOrder?: "asc" | "desc";
}
