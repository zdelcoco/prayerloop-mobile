export interface Prayer {
  createdBy: number;
  datetimeAnswered: string | null;
  datetimeCreate: string;
  datetimeUpdate: string;
  deleted: boolean;
  isAnswered: boolean;
  isPrivate: boolean;
  prayerDescription: string;
  prayerId: number;
  prayerPriority: number;
  prayerType: string;
  title: string;
  updatedBy: number;
  userProfileId: number;
}

export interface GetUserPrayersResponse {
  message: string;
  prayers: Prayer[];
}
