import {
  signInWithRedirect,
  signOut,
  OAuthProvider,
  GoogleAuthProvider,
  TwitterAuthProvider,
  User,
  signInWithPopup,
  UserCredential,
} from "firebase/auth";
import { auth } from ".";

/**
 * Google Authentication Provider instance.
 */
const googleProvider = new GoogleAuthProvider();

/**
 * Twitter (X) Authentication Provider instance.
 */
const twitterProvider = new TwitterAuthProvider();

/**
 * LINE Authentication Provider instance using OpenID Connect.
 */
const lineProvider = new OAuthProvider("oidc.line");

/**
 * A utility object providing methods for Firebase Authentication actions.
 * * @remarks
 * This utility uses `signInWithRedirect`, which will cause the browser to navigate
 * away from the current page to the provider's login portal.
 */
export const authActions = {
  /**
   * Initiates the Google sign-in flow via a page redirect.
   * * @returns A promise that resolves when the redirect is initiated.
   * @example
   * ```ts
   * await authActions.signInWithGoogle();
   * ```
   */
  signInWithGoogle: (): Promise<UserCredential> =>
    signInWithPopup(auth, googleProvider),

  /**
   * Initiates the X (formerly Twitter) sign-in flow via a page redirect.
   * * @returns A promise that resolves when the redirect is initiated.
   */
  signInWithTwitter: (): Promise<UserCredential> =>
    signInWithPopup(auth, twitterProvider),

  /**
   * Initiates the LINE sign-in flow via a page redirect using OIDC.
   * * @returns A promise that resolves when the redirect is initiated.
   */
  signInWithLINE: (): Promise<void> => signInWithRedirect(auth, lineProvider),

  /**
   * Signs out the current user and clears local session data.
   * * @remarks
   * This method specifically removes the 'social' key from `localStorage`
   * before calling the Firebase `signOut` method.
   * * @returns A promise that resolves when the user has been successfully signed out.
   */
  logout: async (): Promise<void> => {
    return signOut(auth);
  },

  /**
   * Retrieves the currently authenticated Firebase user.
   * * @returns The {@link User} object if authenticated, otherwise `null`.
   */
  getCurrentUser: (): User | null => {
    return auth.currentUser;
  },

  /**
   * Returns if the user is authenticated.
   */
  isSignedIn: (): boolean => {
    return !!auth.currentUser;
  },

  /**
   * Retrieves the profile picture URL of the currently authenticated user.
   * * @returns The photo URL string, or an empty string if no user is found or no photo exists.
   */
  getUserIcon: (): string => {
    return auth.currentUser?.photoURL || "";
  },
};
