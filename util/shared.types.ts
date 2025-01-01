export interface ResponseError {
  type: string;
  message: string;
}

export interface Result {
  data?: any;
  error?: ResponseError;
  success: boolean;
}
