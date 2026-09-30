import { query, from } from "@/lib/supabase";
import { awardPoints } from "@/lib/auto-awards";

export interface WhatsAppMessage {
  from: string;
  body: string;
  numMedia: string;
  groupId?: string;
  groupName?: string;
  profileName?: string;
}

export function parseWhatsAppMessage(body: Record<string, string>): WhatsAppMessage {
  const from = body.From || "";
  const bodyText = body.Body || "";
  const numMedia = body.NumMedia || "0";
  const groupId = body.GroupId || undefined;
  const groupName = body.GroupName || undefined;
  const profileName = body.ProfileName || undefined;

  return { from, body: bodyText, numMedia, groupId, groupName, profileName };
}

export function extractPhoneNumber(from: string): string {
  return from.replace("whatsapp:", "");
}

export async function identifyMember(phoneNumber: string): Promise<string | null> {
  const { data } = await query("profiles", {
    select: "user_id",
    filters: { phone: phoneNumber },
    single: true,
  });
  return data?.user_id || null;
}

export type MessageClassification = "help" | "resource" | "event" | "discussion";

export function classifyMessage(body: string): MessageClassification {
  const lower = body.toLowerCase();

  const helpPatterns = [
    "help",
    "how to",
    "how do i",
    "explain",
    "anyone know",
    "can someone",
    "stuck",
    "issue",
    "problem",
    "error",
    "debug",
    "mentor",
  ];
  if (helpPatterns.some((p) => lower.includes(p))) return "help";

  const resourcePatterns = [
    "http",
    "check this out",
    "read this",
    "article",
    "tutorial",
    "video",
    "resource",
    "link",
    "repo",
    "github",
  ];
  if (resourcePatterns.some((p) => lower.includes(p))) return "resource";

  const eventPatterns = [
    "confirm",
    "attending",
    "going",
    "rsvp",
    "event",
    "meetup",
    "workshop",
    "hackathon",
    "register",
  ];
  if (eventPatterns.some((p) => lower.includes(p))) return "event";

  return "discussion";
}

const POINT_VALUES: Record<MessageClassification, number> = {
  help: 5,
  resource: 3,
  event: 2,
  discussion: 1,
};

export function calculateInteractionPoints(classification: MessageClassification): number {
  return POINT_VALUES[classification];
}

export interface ProcessedMessage {
  userId: string | null;
  classification: MessageClassification;
  points: number;
}

export async function processMessage(msg: WhatsAppMessage): Promise<ProcessedMessage> {
  const phoneNumber = extractPhoneNumber(msg.from);
  const userId = await identifyMember(phoneNumber);
  const classification = classifyMessage(msg.body);
  const points = calculateInteractionPoints(classification);

  const interaction: Record<string, any> = {
    phone_number: phoneNumber,
    user_id: userId,
    message_body: msg.body,
    classification,
    points,
    group_id: msg.groupId || null,
    group_name: msg.groupName || null,
    timestamp: new Date().toISOString(),
  };

  await from("whatsapp_interactions").insert(interaction);

  if (userId) {
    await awardPoints(userId, "community", points);
  }

  return { userId, classification, points };
}
