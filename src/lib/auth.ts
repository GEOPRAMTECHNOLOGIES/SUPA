export function verifyAdminCredentials(email: string, password: string): boolean {
  return (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  );
}

export function generateSessionToken(): string {
  return Buffer.from(
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  ).toString('base64');
}
