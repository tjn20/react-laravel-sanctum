import { AxiosError } from "axios";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AuthContextType, AuthProviderProps, AuthState } from "../types/AuthProvidertypes";



const AuthContext = createContext<AuthContextType | undefined>(undefined);



export default function AuthProvider({ children, emailVerification = true, config }: AuthProviderProps) {
  const axiosInstance = useMemo(() => config.axiosInstance, [config.axiosInstance]);

  const { signInRoute, signUpRoute, authenticationCheckRoute, sendEmailVerificationRoute, verifyEmailRoute, signOutRoute } = config;

  const [authenticationState, setAuthenticationState] = useState<AuthState>({
    user: null ,
    authenticated: null,
    verified: null,
  });

  const [loading, setLoading] = useState<boolean>(true);

  const { user, authenticated, verified } = authenticationState;

  useEffect(() => {
    checkAuthentication();
  }, []);

  const signIn = (credentials: Record<string,any>) => {
    return new Promise<{ mustVerifyEmail: boolean; signedIn: boolean; user?: Record<string,any> }>(async (resolve, reject) => {
      try {
        await axiosInstance.post(signInRoute, credentials);
        const user = await revalidate();
        resolve({ mustVerifyEmail: false, signedIn: true, user });
      } catch (error: any) {
        if (error.response?.status === 409 && emailVerification) {
          setAuthenticationState({ user: null, authenticated: true, verified: false });
          resolve({ mustVerifyEmail: true, signedIn: false });
        } else {
          reject(error);
        }
      }
    });
  };

  const signUp = (credentials: Record<string,any>) => {
    return new Promise<{ mustVerifyEmail: boolean; signedIn: boolean; user?: Record<string,any> }>(async (resolve, reject) => {
      try {
        if(!signUpRoute)
        {
          return reject(new Error("signUpRoute is not defined"));
        }
        await axiosInstance.post(signUpRoute, credentials);
        if (emailVerification) {
          setAuthenticationState({ user: null, authenticated: true, verified: false });
          resolve({ mustVerifyEmail: true, signedIn: false });
        } else {
          const user = await revalidate();
          resolve({ mustVerifyEmail: false, signedIn: true, user });
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  const revalidate = () => {
    return new Promise<{}>(async (resolve, reject) => {
      try {
        const { data: user } = await axiosInstance.get(authenticationCheckRoute);
        setAuthenticationState({ user, authenticated: true, verified: true });
        resolve(user);
      } catch (error: any) {
        if (error.response?.status === 401) {
          setAuthenticationState({ user: null, authenticated: false, verified: null });
          resolve({});
        } else if (error.response?.status === 409) {
          setAuthenticationState({ user: null, authenticated: true, verified: false });
          resolve({});
        } else {
          reject(error);
        }
      }
    });
  };

  const handleSessionTimeOut = (error: AxiosError) => {
    if (error.response?.status === 401 || error.response?.status === 409) {
      setAuthenticationState({ user: null, authenticated: false, verified: false });
    }
  };

  const verifyEmail = (id: string, hash: string, expires: string, signature: string) => {
    return new Promise<{}>(async (resolve, reject) => {
      try {
        const url = verifyEmailRoute?.(id, hash, expires, signature);
        if(!url)
        {
          return reject(new Error("verifyEmailRoute is not defined"));
        }
        await axiosInstance.get(url);
        const user = await revalidate();
        resolve(user);
      } catch (error) {
        reject(error);
      }
    });
  };

  const sendEmailVerification = () => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        if(!sendEmailVerificationRoute)
        {
          return reject(new Error("sendEmailVerificationRoute is not defined"));
        }
        await axiosInstance.post(sendEmailVerificationRoute);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  };

  const signOut = () => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await axiosInstance.post(signOutRoute);
        setAuthenticationState({ user: null, authenticated: false, verified: false });
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  };

  const checkAuthentication = () => {
    return new Promise<boolean>(async (resolve, reject) => {
      setLoading(true);
      if (authenticated === null || verified === null) {
        try {
          await revalidate();
          resolve(true);
        } catch (error: any) {
          if (error.response?.status === 401) {
            setAuthenticationState({ user: null, authenticated: false, verified: null });
            resolve(false);
          } else if (error.response?.status === 409) {
            setAuthenticationState({ user: null, authenticated: true, verified: false });
            resolve(false);
          } else {
            reject(error);
          }
        } finally {
          setLoading(false);
        }
      } else {
        resolve(authenticated);
      }
    });
  };

  const setUser = (user: Record<string,any> | null, authenticated: boolean, verified: boolean) => {
    setAuthenticationState({ user, authenticated, verified });
  };

  return (
    <AuthContext.Provider
      value={{
        authenticated,
        user,
        verified,
        loading,
        setUser,
        signIn,
        signUp,
        verifyEmail,
        sendEmailVerification,
        signOut,
        handleSessionTimeOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth should only be used inside <AuthProvider/>");
  return context;
};
