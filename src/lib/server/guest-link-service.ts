import type { DatabaseService, GuestLinkRecord } from "@/lib/types";
import { createGuestEventLink, verifyGuestEventLink, type GuestEventGrant } from "./event-guest";

async function database(service?: DatabaseService) {
  return service ?? (await import("./db-service")).getDbService();
}

export async function issueGuestLink(event: Pick<GuestEventGrant, "name" | "eventCode" | "year" | "competitionType">, createdBy: string, service?: DatabaseService) {
  const { token, expiresAt } = createGuestEventLink(event);
  const grant = verifyGuestEventLink(token)!;
  const record: GuestLinkRecord = { ...event, id: grant.nonce, token, expiresAt, createdAt: Date.now(), createdBy, revokedAt: null };
  await (await database(service)).addGuestLink(record);
  return record;
}

export async function resolveGuestEventLink(token: string, service?: DatabaseService): Promise<GuestEventGrant | null> {
  const grant = verifyGuestEventLink(token);
  if (!grant) return null;
  try {
    const db = await database(service);
    let record = await db.getGuestLink(grant.nonce);
    // Older, stateless links can only be discovered when presented. Persist
    // them once so that they can be listed and revoked without breaking access.
    if (!record && !grant.tracked) {
      const legacy: GuestLinkRecord = { ...grant, id: grant.nonce, token, createdAt: grant.expiresAt - 7 * 24 * 60 * 60 * 1000, createdBy: "legacy", revokedAt: null };
      try { await db.addGuestLink(legacy); } catch {
        // Another request may have registered or revoked this link concurrently.
      }
      record = await db.getGuestLink(grant.nonce);
    }
    return record && record.token === token && record.revokedAt === null ? grant : null;
  } catch {
    // No registry read means no authorization, including already signed-in guests.
    return null;
  }
}

export async function activeGuestLinks(service?: DatabaseService) {
  const records = await (await database(service)).getGuestLinks();
  return records.filter((record) => record.revokedAt === null && record.expiresAt > Date.now() && verifyGuestEventLink(record.token))
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(({ token, ...record }) => ({ ...record, path: `/guest/events/${token}` }));
}
