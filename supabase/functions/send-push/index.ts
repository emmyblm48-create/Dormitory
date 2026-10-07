// Sends a Web Push notification for each row inserted into public.notifications.
// Invoked by the notifications_push_on_insert trigger (pg_net), not by the app, so verify_jwt
// is off and a shared secret header is checked instead. VAPID keys and the secret are kept in
// Supabase Vault and read through the service-role-only get_push_config() RPC.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

let config: Record<string, string> | null = null;
const loadConfig = async () => {
  if (config) return config;
  const { data, error } = await supabase.rpc("get_push_config");
  if (error || !data) throw new Error(`get_push_config failed: ${error?.message}`);
  config = data as Record<string, string>;
  webpush.setVapidDetails(config.vapid_subject, config.vapid_public_key, config.vapid_private_key);
  return config;
};

Deno.serve(async (req) => {
  let cfg: Record<string, string>;
  try {
    cfg = await loadConfig();
  } catch (err) {
    console.error(err);
    return new Response("config error", { status: 500 });
  }

  if (req.headers.get("x-webhook-secret") !== cfg.push_webhook_secret) {
    return new Response("unauthorized", { status: 401 });
  }

  let row: { id: number; recipient_email: string; title: string; body: string; url: string | null; type: string };
  try {
    row = (await req.json())?.record;
  } catch {
    return new Response("bad request", { status: 400 });
  }
  if (!row?.recipient_email) return new Response("ok");

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("email", row.recipient_email);
  if (error) {
    console.error("push_subscriptions lookup failed", error);
    return new Response("ok");
  }
  if (!subs?.length) return new Response("ok");

  const payload = JSON.stringify({ id: row.id, title: row.title, body: row.body, url: row.url, type: row.type });

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
      } catch (err: any) {
        const status = err?.statusCode ?? err?.status;
        // The browser dropped this subscription; stop sending to it
        if (status === 404 || status === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        } else {
          console.error("push send failed for subscription", sub.id, err);
        }
      }
    })
  );

  return new Response("ok");
});
