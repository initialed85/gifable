export function getAllowedSsoEmail(
  request: Request,
  allowedEmails: string[]
): string | null {
  const email = request.headers.get("X-Forwarded-Email")?.trim().toLowerCase();
  if (!email) return null;

  const normalizedAllowlist = allowedEmails.map((value) =>
    value.trim().toLowerCase()
  );
  return normalizedAllowlist.includes(email) ? email : null;
}
