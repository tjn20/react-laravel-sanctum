import { AxiosInstance } from "axios"
import { ReactNode } from "react";

export interface AuthConfig {
  axiosInstance: AxiosInstance;
  signInRoute: string;
  signUpRoute?: string;
  authenticationCheckRoute: string;
  sendEmailVerificationRoute?: string;
  verifyEmailRoute?: (id: string, hash: string, expires: string, signature: string) => string;
  signOutRoute: string;
}

export interface AuthState {
  user: Record<string,any> | null;
  authenticated: boolean | null;
  verified: boolean | null;
}

export interface AuthContextType {
  user: Record<string,any> | null;
  authenticated: boolean | null;
  verified: boolean | null;
  loading: boolean;
  setUser: (user: Record<string,any> | null, authenticated: boolean, verified: boolean) => void;
  signIn: (credentials: Record<string,any>) => Promise<{ mustVerifyEmail: boolean; signedIn: boolean; user?: Record<string,any> }>;
  signUp: (credentials: Record<string,any>) => Promise<{ mustVerifyEmail: boolean; signedIn: boolean; user?: Record<string,any> }>;
  verifyEmail: (id: string, hash: string, expires: string, signature: string) => Promise<{}>;
  sendEmailVerification: () => Promise<void>;
  signOut: () => Promise<void>;
  handleSessionTimeout: (error: any) => void;
}

export interface AuthProviderProps {
  children: ReactNode;
  emailVerification?: boolean;
  config: AuthConfig;
}