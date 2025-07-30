export interface SignupRequest {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface SignupResponse {
  message: string;
  user: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
  };
}