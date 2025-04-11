
<h1 align="center">React Laravel Sanctum</h1>
<p align="center">
  <a href="https://www.npmjs.com/package/react-laravel-sanctum">
    <img src="https://img.shields.io/npm/v/react-laravel-sanctum.svg" alt="NPM Version">
  </a>
  <a href="https://www.npmjs.com/package/react-laravel-sanctum">
    <img src="https://img.shields.io/npm/dt/react-laravel-sanctum.svg" alt="Downloads">
  </a>
  <img src="https://img.shields.io/bundlephobia/minzip/react-laravel-sanctum" alt="Bundle Size">
  <img src="https://img.shields.io/github/license/tjn20/react-laravel-sanctum" alt="License">
</p>

## React Laravel Sanctum

A simple and flexible React package for authenticating your React application using [Laravel Sanctum](https://laravel.com/docs/11.x/sanctum#introduction).

- Effortless integration of Laravel Sanctum authentication in your React app
- Built-in support for email verification with [Laravel Breeze](https://laravel.com/docs/11.x/starter-kits#laravel-breeze-installation)
- Minimal dependencies — only requires [axios](https://github.com/axios/axios)
- Simplifies the creation of protected routes

## Installation 

Install from NPM

```
npm i react-laravel-sanctum
```

## Usage 

Wrap your react application in a `<AuthProvider>` component

```js
import React from "react";
import { AuthProvider } from "react-laravel-sanctum";
import { axios } from "axios";
const authConfig = {
  axiosInstance: axios,
  signInRoute: "/login",
  authenticationCheckRoute: "/auth-check",
  signOutRoute: "/logout" 
};

const App = () => (
    <AuthProvider config={authConfig}>
      /* Your application code */
    </AuthProvider>
);
```
You can then use the `useAuth()` hook to access authentication and verification status, user data, and other related methods in any component wrapped by the `<AuthProvider>` component.

```js
import { useAuth } from "react-laravel-sanctum";

const LoginForm = () => (
  const { signIn } = useAuth()

  const handleLogin = () => {
    const credentials = { 
      email: "username@example.com",
      password: "example"
    }

    signIn(credentials)
    .then(({mustVerifyEmail})=>{
      if(mustVerifyEmail)
      {
        console.log("Must Verify Email Message")
      }
    })
    .catch((error)=>{
      console.log("Error Message")
    })
  }
    retrun <button onClick={()=>handleLogin()}>Login</button>
);
```

```js
import { useAuth } from "react-laravel-sanctum";

const UserComponent = () => (
  const { user } = useAuth()
    retrun (
      <div>
        Hello {user?.first_name}
      </div>
    )
);
```
## Methods & Properties Available with `useAuth()`
The `useAuth` hook gives you access to the `AuthContext`.

| | Description |
|-|------------------------------------------------------------------------------------|
| `user` | The authenticated user object returned from your API. `null` if not authenticated. |
| `authenticated` | Boolean if has authentication has been checked, or null if authentication has not yet been checked. |
| `verified` | Boolean if has verification has been checked, or null if verification has not yet been checked. |
| `loading` | `true` while checking user authentication, `false` when the check is complete. |
| `signIn()` | Accepts `({}: Credentials)`, returns a promise, resolves with `{mustVerifyEmail: boolean, signedIn: boolean, user: {}}`. |
| `signUp()` | Accepts `({}: Credentials)`, resolves with `{mustVerifyEmail: boolean, signedIn: boolean, user: {}}`. |
| `signOut()` | Returns a promise, resolves with no values. |
| `setUser()` |  Accepts `(user, authenticated, verified)`, allows you to manually set the user by providing the user object, authentication and verfication status (boolean). |
| `sendEmailVerification()` | Return a promise, resolves with no values. |
| `verifyEmail()` | Accepts `(id: string, hash: string, expires: string, signature: string)`, returns a promise, resolves with `{user: {}}`.  |
| `handleSessionTimeOut()` | Accepts `(error: AxiosError)`, returns nothing.  |

## Config Setup
Not all URLS in the config are required. These need to be defined in your Laravel application.

```js
const authConfig = {
  // An axiosInstance is required to be used by react-laravel-sanctum.
  axiosInstance: AxiosInstance; 
  /*
  * Required
  * Sends a POST request to this endpoint to log in the user.
  */
  signInRoute: "/login";
  /*
  * Optional (unless signUp() will be used)
  * Sends a POST request to this endpoint to register the user.
  */
  signUpRoute: "/register";
  /*
  * Required  
  * Sends a GET request to this endpoint to this endpoint to check the user authentication status.
  * Returns a user object that is represented as `user` in the React application.
  */  
  authenticationCheckRoute: "/auth-check";
  /*
  * Optional (unless sendEmailVerification() will be used) 
  * Sends a POST request to this endpoint to send an email verification notification.
  */  
  sendEmailVerificationRoute: "/verification-notification";
  /*
  * Optional (unless verifyEmail() will be used) 
  * Sends a GET request to this endpoint to verify the user.
  */  
  verifyEmailRoute: (id: string, hash: string, expires: string, signature: string) => `/verify-email/${id}/${hash}?expires=${expires}&signature=${signature}`;
  /*
  * Required 
  * Sends a POST request to this endpoint to logout the user.
  */ 
  signOutRoute: '/logout';
};
```

react-laravel-sanctum automatically checks if the user is signed in when the `<AuthProvider>` component is mounted. By default, it also assumes `emailVerification` is set to `true` and will check if the user’s email is verified. If you’d like to disable this behavior, simply set emailVerification to `false` like this:

```js
<AuthProvider config={authConfig} emailVerification={false}>
```

## Email Verification

This package supports email verification using Laravel Breeze out of the box.

1. Install Laravel Breeze as an API using the following instructions https://laravel.com/docs/11.x/starter-kits#laravel-breeze-installation

2. Ensure the User Model implements `MustVerifyEmail` interface. 

Example for implementation:

This is the `<SignUpForm> Component`:
```js
import { useAuth } from "react-laravel-sanctum";
import { useNavigate } from "react-router-dom"

const SignUpForm = () => (
  const { signUp } = useAuth()

  const handleRegistration = () => {
    const credentials = { 
      name: "user",
      email: "username@example.com",
      password: "example"
    }

    signUp(credentials)
    .then(({mustVerifyEmail})=>{
      if(mustVerifyEmail)
      {
        navigate('Email verification notification component'); // to allow users to resend the email verification notification
      }
    })
    .catch((error)=>{
      console.log("Error Message")
    })
  }
    retrun <button onClick={()=>handleRegistration()}>SignUp</button>
);
```

This is the `<EmailVerificationProcessing> Component`, The URL is obtained from the verification email sent to the user:
```js
import { useEffect } from "react"
import { useAuth } from "react-laravel-sanctum";
import { useLocation, useParams } from "react-router-dom"

const EmailVerificationProcessing = () => (
    const { verifyEmail }  = useAuth()
    const location = useLocation();
    const { id,hash } = useParams()
    const queryParams = new URLSearchParams(location.search);
    const expires = queryParams.get('expires')
    const signature = queryParams.get('signature')


  useEffect(()=>{
       if(!id || !hash || !expires || !signature) return
       verifyEmail(id,hash,expires,signature)
       .catch((error)=>{
          console.log(error)
       })
    },[])

    retrun (<div>
      Verifying....
    </div>)
);
```

## Axios

react-laravel-sanctum assumes that setting the CSRF token is handled within the provided Axios instance. This is done through request interceptors, allowing users to fully control their own interceptor implementations and customize their Axios instance configuration.
