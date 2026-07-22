import { Bot, InlineKeyboard } from "grammy";
import { logger } from "./lib/logger";

// Lux Verification diamond emoji — the custom_emoji_id is configured at the bot level
// via Telegram's @VerifyBot registration; it cannot be passed per-call via the Bot API.
// Stored here as a reference constant.
const LUX_ICON_ID = "5402122943360706916"; // eslint-disable-line @typescript-eslint/no-unused-vars

// The custom_description passed with each verification call (max 70 chars)
const LUX_DESCRIPTION = "Verified by Lux Organisation";

type AdminAction =
  | "verify_user"
  | "verify_chat"
  | "remove_user"
  | "remove_chat";

// In-memory state: admin waiting for input after pressing a button
const adminPendingAction = new Map<number, AdminAction>();

export function startBot(): void {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    throw new Error("BOT_TOKEN environment variable is required");
  }

  const rawAdminId = process.env.ADMIN_ID;
  if (!rawAdminId) {
    throw new Error("ADMIN_ID environment variable is required");
  }
  const adminId = parseInt(rawAdminId, 10);
  if (isNaN(adminId)) {
    throw new Error("ADMIN_ID must be a valid numeric Telegram user ID");
  }

  const bot = new Bot(token);

  // ─── /start ───────────────────────────────────────────────────────────────
  bot.command("start", async (ctx) => {
    const webappUrl =
      process.env.WEBAPP_URL ||
      (process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}/`
        : "https://t.me/");

    await ctx.reply(
      "We're officially rolling out a brand-new Telegram verification service, designed to give high-quality channels and users a more recognizable verified identity.",
      {
        reply_markup: new InlineKeyboard().webApp(
          "🌐 Open Mini App",
          webappUrl
        ),
      }
    );
  });

  // ─── /adm ─────────────────────────────────────────────────────────────────
  bot.command("adm", async (ctx) => {
    if (ctx.from?.id !== adminId) return; // Silently ignore non-admins

    const keyboard = new InlineKeyboard()
      .text("💎 Verify User", "verify_user")
      .row()
      .text("📢 Verify Channel / Group", "verify_chat")
      .row()
      .text("❌ Remove User Verification", "remove_user")
      .row()
      .text("❌ Remove Channel / Group Verification", "remove_chat");

    await ctx.reply("🛡 Lux Verification System — Admin Panel", {
      reply_markup: keyboard,
    });
  });

  // ─── Inline button handlers ───────────────────────────────────────────────
  bot.callbackQuery(
    ["verify_user", "verify_chat", "remove_user", "remove_chat"],
    async (ctx) => {
      if (ctx.from?.id !== adminId) {
        await ctx.answerCallbackQuery({ text: "⛔ Access denied" });
        return;
      }

      await ctx.answerCallbackQuery();

      const action = ctx.callbackQuery.data as AdminAction;
      adminPendingAction.set(adminId, action);

      const prompts: Record<AdminAction, string> = {
        verify_user:
          "👤 Enter the numeric Telegram user ID to verify:",
        verify_chat:
          "📢 Enter the chat ID (e.g. -1001234567890) or @username of the channel to verify:",
        remove_user:
          "👤 Enter the numeric Telegram user ID to remove verification from:",
        remove_chat:
          "📢 Enter the chat ID or @username of the channel to remove verification from:",
      };

      await ctx.reply(prompts[action]);
    }
  );

  // ─── Text input handler (admin state machine) ─────────────────────────────
  bot.on("message:text", async (ctx) => {
    if (ctx.from?.id !== adminId) return;

    const action = adminPendingAction.get(adminId);
    if (!action) return;

    adminPendingAction.delete(adminId);

    const input = ctx.message.text.trim();

    // Parse target: username (@xxx) stays as string; numeric ID becomes number
    const isUsername = input.startsWith("@");
    const numericId = isUsername ? NaN : parseInt(input, 10);
    const targetId: string | number = isUsername
      ? input
      : isNaN(numericId)
      ? input
      : numericId;

    try {
      switch (action) {
        case "verify_user": {
          // verifyUser only accepts numeric user IDs (not @username)
          if (typeof targetId !== "number") {
            await ctx.reply(
              "⚠️ User verification requires a numeric Telegram ID, not a username."
            );
            return;
          }
          await ctx.api.raw.verifyUser({
            user_id: targetId,
            custom_description: LUX_DESCRIPTION,
          });
          await ctx.reply(
            `✅ Verification successfully granted to user ID ${targetId}.`
          );
          break;
        }

        case "verify_chat": {
          await ctx.api.raw.verifyChat({
            chat_id: targetId,
            custom_description: LUX_DESCRIPTION,
          });
          await ctx.reply(
            `✅ Verification successfully granted to chat / channel: ${targetId}.`
          );
          break;
        }

        case "remove_user": {
          if (typeof targetId !== "number") {
            await ctx.reply(
              "⚠️ Removing user verification requires a numeric Telegram ID, not a username."
            );
            return;
          }
          await ctx.api.raw.removeUserVerification({ user_id: targetId });
          await ctx.reply(
            `✅ Verification successfully removed from user ID ${targetId}.`
          );
          break;
        }

        case "remove_chat": {
          await ctx.api.raw.removeChatVerification({ chat_id: targetId });
          await ctx.reply(
            `✅ Verification successfully removed from chat / channel: ${targetId}.`
          );
          break;
        }
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : String(err);

      logger.error({ err, action, targetId }, "Telegram API verification error");

      await ctx.reply(
        `❌ Telegram API error:\n\n<code>${errorMessage}</code>\n\n` +
          `ℹ️ Note: verification methods require the bot to hold a verified account status ` +
          `(blue checkmark from @VerifyBot or Telegram itself). ` +
          `Without that status, Telegram's servers reject all verification requests.`,
        { parse_mode: "HTML" }
      );
    }
  });

  // ─── Global error handler ─────────────────────────────────────────────────
  bot.catch((err) => {
    logger.error({ err: err.error }, "Unhandled bot error");
  });

  // Start polling
  bot.start({
    onStart: (info) => {
      logger.info({ username: info.username }, "Bot started polling");
    },
  }).catch((err) => {
    logger.error({ err }, "Bot polling failed — check BOT_TOKEN and network");
    process.exit(1);
  });

  logger.info("Telegram bot initialized");
}
