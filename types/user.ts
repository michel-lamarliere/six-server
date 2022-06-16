import { Log } from "./log";

export interface User {
  icon: number;
  name: string;
  emailAddress: {
    value: string;
    confirmed: boolean;
    confirmationEmailUniqueCode: string;
    timeBeforeNextConfirmationEmail: Date;
  };
  password: {
    value: string;
    forgotPasswordEmailUniqueCode: null | string;
    timeBeforeNextForgotPasswordEmail: null | Date;
  };
  goals: {
    nutrition: null | string;
    sleep: null | string;
    relaxation: null | string;
    projects: null | string;
    sports: null | string;
    social_life: null | string;
  };
  deleteAccountUniqueCode: null | string;
  log: Log | [];
}
