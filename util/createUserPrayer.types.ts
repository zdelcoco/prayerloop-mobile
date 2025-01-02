export interface CreateUserPrayerRequest {
  title: string;
  prayerDescription: string;
  isPrivate: boolean;
  prayerType: string;
}

export interface CreateUserPrayerResponse {
  message: string;
  prayerId: number;
  prayerAccessId: number;
}