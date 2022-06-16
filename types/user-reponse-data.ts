export interface UserResponseData {
  token: string;
  icon: number;
  name: string;
  emailAddress: {
    value: string;
    confirmed: boolean;
  };
}
