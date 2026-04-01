/**
 * Ephemeral in-memory store for sign-up credentials.
 * Used to pass email + password from the sign-up screen to the
 * email verification screen without putting the password in URL params.
 * Cleared immediately after the account is created.
 */
export const pendingSignUp = { email: "", password: "" };
