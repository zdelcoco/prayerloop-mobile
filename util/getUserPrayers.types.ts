import { Prayer } from './shared.types';
export interface GetUserPrayersResponse {
  message: string;
  prayers: Prayer[];
}
