export interface ResponseError {
  type: string;
  message: string;
}

export interface Result {
  data?: any;
  error?: ResponseError;
  success: boolean;
}

export interface DefaultAPIResponse {
  message?: string;
  error?: string;
};

export interface Prayer {
  createdBy: number;
  datetimeAnswered: string | null;
  datetimeCreate: string;
  datetimeUpdate: string;
  deleted: boolean;
  isAnswered: boolean;
  isPrivate: boolean;
  prayerDescription: string;
  prayerAccessId: number;
  prayerId: number;
  prayerPriority: number;
  prayerType: string;
  title: string;
  updatedBy: number;
  userProfileId: number;
}