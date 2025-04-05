import { User } from './shared.types';

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}
