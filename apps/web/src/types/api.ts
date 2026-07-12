export interface ApiSuccessResponse<T> {
  data: T;
  message?: string;
}

export interface ApiErrorBody {
  message?: string;
  error?: string;
  errors?: Record<string, string[] | string>;
  statusCode?: number;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type ApiResponse<T> = ApiSuccessResponse<T> | T;
