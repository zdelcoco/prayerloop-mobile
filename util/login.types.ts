export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface User {
  createdBy: number;
  datetimeCreate: string;
  datetimeUpdate: string;
  deleted: boolean;
  email: string;
  firstName: string;
  lastName: string;
  updatedBy: number;
  userProfileId: number;
  username: string;
}
