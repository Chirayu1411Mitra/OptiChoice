export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  dateOfBirth: string | null;
  gender: string | null;
  phoneNumber: string | null;
  location: string | null;
}

export type ProfileUpdate = Pick<User, "name" | "dateOfBirth" | "gender" | "phoneNumber" | "location">;

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}
