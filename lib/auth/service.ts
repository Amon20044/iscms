import { randomUUID } from "node:crypto";
import { and, desc, eq, gt, inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db/client";
import { appUserProfiles, authAccounts, authSessions } from "@/lib/db/schema";
import { createSessionToken, hashPassword, hashSessionToken, verifyPassword } from "@/lib/auth/password";
import {
  DASHBOARD_ROLES,
  type AuthenticatedUser,
  type InternalAccessUser,
  type UserRole,
} from "@/lib/supply-chain/types";

const SESSION_COOKIE_NAME = "srs_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export class AuthError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "auth_error") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeName(name: string) {
  return name.trim();
}

function validatePasswordShape(password: string) {
  const trimmed = password.trim();

  if (trimmed.length < 8) {
    throw new AuthError(
      "Password must be at least 8 characters long.",
      400,
      "weak_password"
    );
  }

  return trimmed;
}

function mapAuthenticatedUser(row: {
  account: typeof authAccounts.$inferSelect;
  profile: typeof appUserProfiles.$inferSelect;
}): AuthenticatedUser {
  return {
    id: row.profile.id,
    accountId: row.account.id,
    name: row.profile.name,
    email: row.profile.email ?? "",
    role: row.profile.role,
  };
}

export function isDashboardRole(role: UserRole) {
  return DASHBOARD_ROLES.includes(role);
}

export function canManageAdmins(role: UserRole) {
  return role === "owner";
}

export async function writeSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    expires: expiresAt,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const db = getDb();
  const [row] = await db
    .select({
      account: authAccounts,
      profile: appUserProfiles,
    })
    .from(authSessions)
    .innerJoin(authAccounts, eq(authSessions.accountId, authAccounts.id))
    .innerJoin(appUserProfiles, eq(authAccounts.profileId, appUserProfiles.id))
    .where(
      and(
        eq(authSessions.sessionTokenHash, hashSessionToken(sessionToken)),
        gt(authSessions.expiresAt, new Date()),
        eq(authAccounts.isActive, true)
      )
    )
    .limit(1);

  if (!row?.profile.email) {
    return null;
  }

  return mapAuthenticatedUser(row);
}

export async function requireAuthenticatedUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireDashboardUser() {
  const user = await requireAuthenticatedUser();

  if (!isDashboardRole(user.role)) {
    redirect("/");
  }

  return user;
}

export async function requireOwnerUser() {
  const user = await requireDashboardUser();

  if (!canManageAdmins(user.role)) {
    redirect("/dashboard");
  }

  return user;
}

export async function requireRouteUser(allowedRoles?: UserRole[]) {
  const user = await getCurrentUser();

  if (!user) {
    throw new AuthError("Please sign in to continue.", 401, "unauthenticated");
  }

  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    throw new AuthError(
      "You do not have access to this action.",
      403,
      "forbidden"
    );
  }

  return user;
}

export async function createLoginSession(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const trimmedPassword = password.trim();

  if (!normalizedEmail || !trimmedPassword) {
    throw new AuthError(
      "Email and password are required.",
      400,
      "missing_credentials"
    );
  }

  const db = getDb();
  const [row] = await db
    .select({
      account: authAccounts,
      profile: appUserProfiles,
    })
    .from(authAccounts)
    .innerJoin(appUserProfiles, eq(authAccounts.profileId, appUserProfiles.id))
    .where(
      and(
        eq(appUserProfiles.email, normalizedEmail),
        eq(authAccounts.isActive, true)
      )
    )
    .limit(1);

  if (!row || !verifyPassword(trimmedPassword, row.account.passwordHash)) {
    throw new AuthError(
      "Invalid email or password.",
      401,
      "invalid_credentials"
    );
  }

  const token = createSessionToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

  await db.insert(authSessions).values({
    accountId: row.account.id,
    sessionTokenHash: hashSessionToken(token),
    expiresAt,
    lastSeenAt: now,
    createdAt: now,
    updatedAt: now,
  });

  return {
    expiresAt,
    token,
    user: mapAuthenticatedUser(row),
  };
}

export async function logoutCurrentSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    const db = getDb();

    await db
      .delete(authSessions)
      .where(eq(authSessions.sessionTokenHash, hashSessionToken(sessionToken)));
  }

  await clearSessionCookie();
}

export async function listInternalAccessUsers(): Promise<InternalAccessUser[]> {
  const db = getDb();
  const rows = await db
    .select({
      account: authAccounts,
      profile: appUserProfiles,
    })
    .from(authAccounts)
    .innerJoin(appUserProfiles, eq(authAccounts.profileId, appUserProfiles.id))
    .where(inArray(appUserProfiles.role, DASHBOARD_ROLES))
    .orderBy(desc(appUserProfiles.createdAt));

  return rows.map((row) => ({
    accountId: row.account.id,
    createdAt: row.account.createdAt.toISOString(),
    email: row.profile.email ?? "",
    id: row.profile.id,
    name: row.profile.name,
    role: row.profile.role,
  }));
}

export async function createInternalAccessUser(input: {
  email: string;
  name: string;
  password: string;
  role: UserRole;
}) {
  const name = normalizeName(input.name);
  const email = normalizeEmail(input.email);

  if (!name) {
    throw new AuthError("Name is required.", 400, "missing_name");
  }

  if (!email) {
    throw new AuthError("Email is required.", 400, "missing_email");
  }

  if (!["org_admin", "admin"].includes(input.role)) {
    throw new AuthError(
      "Only org admin and admin accounts can be created here.",
      400,
      "invalid_role"
    );
  }

  const password = validatePasswordShape(input.password);
  const passwordHash = hashPassword(password);
  const db = getDb();

  return db.transaction(async (tx) => {
    const [existingProfile] = await tx
      .select({ id: appUserProfiles.id })
      .from(appUserProfiles)
      .where(eq(appUserProfiles.email, email))
      .limit(1);

    if (existingProfile) {
      throw new AuthError(
        "A user with this email already exists.",
        409,
        "email_taken"
      );
    }

    const now = new Date();
    const [profile] = await tx
      .insert(appUserProfiles)
      .values({
        authUserId: `manual-${randomUUID().slice(0, 8)}`,
        name,
        email,
        role: input.role,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const [account] = await tx
      .insert(authAccounts)
      .values({
        profileId: profile.id,
        passwordHash,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return {
      accountId: account.id,
      createdAt: account.createdAt.toISOString(),
      email: profile.email ?? email,
      id: profile.id,
      name: profile.name,
      role: profile.role,
    } satisfies InternalAccessUser;
  });
}
