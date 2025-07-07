// StatusDetail.ts
export interface StatusDetail {
  code: { code: string; message: string }; // e.g., "success"
  message: string; // e.g., "Login successful"
}

// Pagination.ts
export interface Pagination {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
}

// ErrorDetail.ts
export interface ErrorDetail {
  field?: string;
  message: string;
}

// GeneralResponse.ts
export interface GeneralResponse<T> {
  status: StatusDetail;
  data: T | null;
  message: string;
  timestamp: string;
  pagination?: Pagination;
  errors?: ErrorDetail[];
}
