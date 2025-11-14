export type AuthStackParamList = {
  PhoneInput: undefined;
  OtpVerification: { phoneNumber: string };
  ProfileSetup: { userId: string; phoneNumber: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Groups: undefined;
  Activity: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};
