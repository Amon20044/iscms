import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, gt, inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db/client";
import {
  appUserProfiles,
  authAccounts,
  authSessions,
  organizations,
} from "@/lib/db/schema";
import {
  createSessionToken,
  hashPassword,
  hashSessionToken,
  verifyPassword,
} from "@/lib/auth/password";
import {
  DASHBOARD_ROLES,
  type AuthenticatedUser,
  type InternalAccessUser,
  type Organization,
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

function normalizeOrganizationCode(code: string) {
  const normalized = code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (normalized.length < 2) {
    throw new AuthError(
      "Organization code must contain at least 2 letters or numbers.",
      400,
      "invalid_org_code"
    );
  }

  return normalized;
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

function mapOrganization(
  organization: typeof organizations.$inferSelect
): Organization {
  return {
    id: organization.id,
    code: organization.code,
    name: organization.name,
  };
}

function mapAuthenticatedUser(row: {
  account: typeof authAccounts.$inferSelect;
  profile: typeof appUserProfiles.$inferSelect;
  organization: typeof organizations.$inferSelect | null;
}): AuthenticatedUser {
  return {
    id: row.profile.id,
    accountId: row.account.id,
    name: row.profile.name,
    email: row.profile.email ?? "",
    role: row.profile.role,
    organizationId: row.organization?.id ?? undefined,
    organizationCode: row.organization?.code ?? undefined,
    organizationName: row.organization?.name ?? undefined,
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
      organization: organizations,
    })
    .from(authSessions)
    .innerJoin(authAccounts, eq(authSessions.accountId, authAccounts.id))
    .innerJoin(appUserProfiles, eq(authAccounts.profileId, appUserProfiles.id))
    .leftJoin(organizations, eq(appUserProfiles.organizationId, organizations.id))
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
      organization: organizations,
    })
    .from(authAccounts)
    .innerJoin(appUserProfiles, eq(authAccounts.profileId, appUserProfiles.id))
    .leftJoin(organizations, eq(appUserProfiles.organizationId, organizations.id))
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

export async function listOrganizations(): Promise<Organization[]> {
  const db = getDb();
  const rows = await db.select().from(organizations).orderBy(asc(organizations.name));
  return rows.map(mapOrganization);
}

export async function createOrganization(input: { code: string; name: string }) {
  const code = normalizeOrganizationCode(input.code);
  const name = normalizeName(input.name);

  if (!name) {
    throw new AuthError("Organization name is required.", 400, "missing_org_name");
  }

  const db = getDb();

  return db.transaction(async (tx) => {
    const [existingOrganization] = await tx
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.code, code))
      .limit(1);

    if (existingOrganization) {
      throw new AuthError(
        "An organization with this code already exists.",
        409,
        "org_code_taken"
      );
    }

    const now = new Date();
    const [organization] = await tx
      .insert(organizations)
      .values({
        code,
        name,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return mapOrganization(organization);
  });
}

export async function listInternalAccessUsers(): Promise<InternalAccessUser[]> {
  const db = getDb();
  const rows = await db
    .select({
      account: authAccounts,
      profile: appUserProfiles,
      organization: organizations,
    })
    .from(authAccounts)
    .innerJoin(appUserProfiles, eq(authAccounts.profileId, appUserProfiles.id))
    .leftJoin(organizations, eq(appUserProfiles.organizationId, organizations.id))
    .where(inArray(appUserProfiles.role, DASHBOARD_ROLES))
    .orderBy(desc(appUserProfiles.createdAt));

  return rows.map((row) => ({
    accountId: row.account.id,
    createdAt: row.account.createdAt.toISOString(),
    email: row.profile.email ?? "",
    id: row.profile.id,
    name: row.profile.name,
    role: row.profile.role,
    organizationId: row.organization?.id ?? undefined,
    organizationCode: row.organization?.code ?? undefined,
    organizationName: row.organization?.name ?? undefined,
  }));
}

export async function createInternalAccessUser(input: {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  organizationId?: string;
}) {
  const name = normalizeName(input.name);
  const email = normalizeEmail(input.email);

  if (!name) {
    throw new AuthError("Name is required.", 400, "missing_name");
  }

  if (!email) {
    throw new AuthError("Email is required.", 400, "missing_email");
  }

  if (![
    "org_admin",
    "admin",
  ].includes(input.role)) {
    throw new AuthError(
      "Only org admin and admin accounts can be created here.",
      400,
      "invalid_role"
    );
  }

  if (input.role === "org_admin" && !input.organizationId) {
    throw new AuthError(
      "Select an organization for the org admin account.",
      400,
      "missing_org_assignment"
    );
  }

  if (input.role === "admin" && input.organizationId) {
    throw new AuthError(
      "Platform admins are created without an organization assignment.",
      400,
      "invalid_org_assignment"
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

    const organization = input.organizationId
      ? (
          await tx
            .select()
            .from(organizations)
            .where(eq(organizations.id, input.organizationId))
            .limit(1)
        )[0] ?? null
      : null;

    if (input.organizationId && !organization) {
      throw new AuthError(
        "Selected organization does not exist.",
        404,
        "org_not_found"
      );
    }

    const now = new Date();
    const [profile] = await tx
      .insert(appUserProfiles)
      .values({
        authUserId: `manual-${randomUUID().slice(0, 8)}`,
        organizationId: organization?.id ?? null,
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
      organizationId: organization?.id ?? undefined,
      organizationCode: organization?.code ?? undefined,
      organizationName: organization?.name ?? undefined,
    } satisfies InternalAccessUser;
  });
}
