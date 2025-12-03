// supabase/functions/bitkey-verify/index.ts
// Bitkey signature verification for nuclear God Mode actions

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Verify ECDSA signature (secp256k1 - Bitcoin standard)
async function verifyBitkeySignature(
  message: string,
  signature: string,
  publicKey: string
): Promise<boolean> {
  try {
    // Convert hex strings to Uint8Array
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = hexToBytes(signature);
    const publicKeyBytes = hexToBytes(publicKey);

    // SHA-256 hash of message
    const messageHash = await crypto.subtle.digest("SHA-256", messageBytes);

    // Import public key for ECDSA verification
    const key = await crypto.subtle.importKey(
      "raw",
      publicKeyBytes,
      {
        name: "ECDSA",
        namedCurve: "P-256", // Note: Bitkey uses secp256k1, but Web Crypto API uses P-256
        // For production, use a proper secp256k1 library like noble-secp256k1
      },
      false,
      ["verify"]
    );

    // Verify signature
    const isValid = await crypto.subtle.verify(
      {
        name: "ECDSA",
        hash: "SHA-256",
      },
      key,
      signatureBytes,
      messageHash
    );

    return isValid;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname.replace(/^\/bitkey-verify/, "");

    // Create Supabase client with user's JWT
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: req.headers.get("Authorization") || "",
        },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: "Not authenticated" }, 401);
    }

    // ========= 1) GENERATE CHALLENGE =========
    if (pathname === "/challenge" && req.method === "POST") {
      const body = await req.json();
      const { actionType, metadata = {} } = body;

      if (!actionType) {
        return jsonResponse({ error: "actionType required" }, 400);
      }

      // Get god_mode_users record
      const { data: godUser, error: godErr } = await supabase
        .from("god_mode_users")
        .select("id, bitkey_serial, bitkey_public_key")
        .eq("user_id", user.id)
        .single();

      if (godErr || !godUser) {
        return jsonResponse({ error: "Not a God Mode user" }, 403);
      }

      if (!godUser.bitkey_serial || !godUser.bitkey_public_key) {
        return jsonResponse({ error: "Bitkey not registered" }, 400);
      }

      // Generate challenge via RPC
      const { data: challenge, error: rpcErr } = await supabase.rpc(
        "generate_bitkey_challenge",
        {
          p_god_user_id: godUser.id,
          p_action_type: actionType,
          p_metadata: metadata,
        }
      );

      if (rpcErr) {
        console.error("Challenge generation error:", rpcErr);
        return jsonResponse({ error: rpcErr.message }, 500);
      }

      return jsonResponse({
        success: true,
        challenge,
      });
    }

    // ========= 2) VERIFY SIGNATURE =========
    if (pathname === "/verify" && req.method === "POST") {
      const body = await req.json();
      const { challengeId, signature } = body;

      if (!challengeId || !signature) {
        return jsonResponse(
          { error: "challengeId and signature required" },
          400
        );
      }

      // Get challenge
      const { data: challenge, error: chErr } = await supabase
        .from("bitkey_challenges")
        .select("*, god_mode_users!inner(bitkey_public_key)")
        .eq("id", challengeId)
        .single();

      if (chErr || !challenge) {
        return jsonResponse({ error: "Challenge not found" }, 404);
      }

      // Check expiration
      if (new Date(challenge.expires_at) < new Date()) {
        return jsonResponse({ error: "Challenge expired" }, 400);
      }

      // Check if already used
      if (challenge.is_used) {
        return jsonResponse({ error: "Challenge already used" }, 400);
      }

      // Verify signature
      const publicKey = challenge.god_mode_users.bitkey_public_key;
      const challengeText = challenge.challenge_text;

      // TODO: For production, use proper secp256k1 verification
      // For now, we'll use a simplified check
      const isValid = await verifyBitkeySignature(
        challengeText,
        signature,
        publicKey
      );

      if (!isValid) {
        return jsonResponse({ error: "Invalid signature" }, 400);
      }

      // Store verification result via RPC
      const { data: result, error: verifyErr } = await supabase.rpc(
        "verify_bitkey_signature",
        {
          p_challenge_id: challengeId,
          p_signature: signature,
          p_ip_address:
            req.headers.get("x-forwarded-for") ||
            req.headers.get("cf-connecting-ip") ||
            "0.0.0.0",
          p_user_agent: req.headers.get("user-agent") || "unknown",
        }
      );

      if (verifyErr) {
        console.error("Verification storage error:", verifyErr);
        return jsonResponse({ error: verifyErr.message }, 500);
      }

      return jsonResponse({
        success: true,
        verified: true,
        actionId: result.action_id,
        actionType: result.action_type,
      });
    }

    // ========= 3) EXECUTE KILL SWITCH (with Bitkey proof) =========
    if (pathname === "/kill-switch" && req.method === "POST") {
      const body = await req.json();
      const { actionId, reason } = body;

      if (!actionId || !reason) {
        return jsonResponse({ error: "actionId and reason required" }, 400);
      }

      // Get god_mode_users record
      const { data: godUser, error: godErr } = await supabase
        .from("god_mode_users")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (godErr || !godUser) {
        return jsonResponse({ error: "Not a God Mode user" }, 403);
      }

      // Execute kill switch via RPC
      const { data: result, error: execErr } = await supabase.rpc(
        "activate_kill_switch_with_bitkey",
        {
          p_god_user_id: godUser.id,
          p_bitkey_action_id: actionId,
          p_reason: reason,
        }
      );

      if (execErr) {
        console.error("Kill switch execution error:", execErr);
        return jsonResponse({ error: execErr.message }, 500);
      }

      if (!result.success) {
        return jsonResponse({ error: result.error }, 400);
      }

      return jsonResponse({
        success: true,
        killSwitchActive: true,
        activatedAt: result.activated_at,
      });
    }

    // Fallback
    return jsonResponse({ error: "Not found" }, 404);
  } catch (err) {
    console.error("Edge function error:", err);
    return jsonResponse({ error: "Internal error" }, 500);
  }
});
