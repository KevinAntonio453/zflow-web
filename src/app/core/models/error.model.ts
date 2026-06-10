export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: ApiFieldError[];
}

export interface ApiFieldError {
  field: string;
  message: string;
}
