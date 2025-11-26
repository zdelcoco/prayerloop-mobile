export interface SignupRequest {
  password: string;
  email: string;
  firstName: string;
  lastName?: string;
  phoneNumber?: string;
}

export interface SignupResponse {
  message: string;
  user: {
    email: string;
    firstName: string;
    lastName?: string;
    phoneNumber?: string;
  };
}
