const FAKE_DOMAIN = "gamos.local";

export function usernameToEmail(username: string) {
  return `${username.toLowerCase().trim()}@${FAKE_DOMAIN}`;
}

export function emailToUsername(email: string) {
  if (email.endsWith(`@${FAKE_DOMAIN}`)) {
    return email.replace(`@${FAKE_DOMAIN}`, "");
  }
  return email;
}
