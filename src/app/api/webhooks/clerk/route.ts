import { Webhook } from "svix";
import { headers } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";

type ClerkWebhookData = {
  id?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  image_url?: string;
};

type ClerkWebhookMessage = {
  type?: string;
  data?: ClerkWebhookData;
};

export async function POST(req: Request) {
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  const body = await req.text();
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");
  let msg: ClerkWebhookMessage;
  try {
    msg = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as ClerkWebhookMessage;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  if (msg.type === "user.created" && msg.data?.id) {
    try {
      const firstName = msg.data.first_name ?? "";
      const lastName = msg.data.last_name ?? "";
      const fallbackName = msg.data.username ?? "";
      const imageUrl = msg.data.image_url;
      const name = `${firstName} ${lastName}`.trim() || fallbackName || "Anonymous";

      await convex.mutation(api.users.createUserIfNotExists, {
        userId: msg.data.id,
        name,
        userProfile: imageUrl,
      });
    } catch (e) {
      console.error("Error creating user in Convex:", e);
    }
  }

  return new Response("", { status: 200 });
}
