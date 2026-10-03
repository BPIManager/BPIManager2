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
 * Firebase Authentication の操作をまとめたユーティリティ。signInWithRedirect を使うため、ブラウザはプロバイダのログインページへ遷移する。
 */
export const authActions = {
  /**
   * Google のリダイレクト方式でサインインを開始する。Promise はリダイレクトの開始時点で解決する。
   *
   * @returns リダイレクト開始時に解決する Promise
   */
  signInWithGoogle: (loginHint?: string): Promise<UserCredential> => {
    googleProvider.setCustomParameters(
      loginHint ? { login_hint: loginHint } : {},
    );
    return signInWithPopup(auth, googleProvider);
  },

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
  signInWithLINE: (loginHint?: string): Promise<void> => {
    lineProvider.setCustomParameters(
      loginHint ? { login_hint: loginHint } : {},
    );
    return signInWithRedirect(auth, lineProvider);
  },

  /**
   * 現在のユーザーをサインアウトし、ローカルのセッションデータを削除する。
   * Firebase の signOut を呼ぶ前に localStorage の 'social' キーを削除する。
   *
   * @returns サインアウト完了時に解決する Promise
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
