const TOKEN_KEY = "token";
const USER_KEY = "user_email";

export function setSession(token: string, email: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, email);
}
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getUserEmail = () => localStorage.getItem(USER_KEY) ?? "";
export const isAuthed = () => !!getToken();