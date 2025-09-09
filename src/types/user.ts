export type Role = "ADMIN" | "USER";

export interface SessionUser {
  id: string;
  name: string;
  nip: string;
  role: Role;
}
