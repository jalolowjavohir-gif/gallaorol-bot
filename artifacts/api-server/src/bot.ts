import { Telegraf, Markup, Context } from "telegraf";
import { logger } from "./lib/logger";

const BOT_TOKEN = process.env["TELEGRAM_BOT_TOKEN"];
const ADMIN_ID = 7343262344;

if (!BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN environment variable is required");
}

interface UserSession {
  step: string;
  selectedCourse?: string;
  selectedTime?: string;
  phone?: string;
  name?: string;
}

const sessions = new Map<number, UserSession>();

function getSession(userId: number): UserSession {
  if (!sessions.has(userId)) {
    sessions.set(userId, { step: "start" });
  }
  return sessions.get(userId)!;
}

const bot = new Telegraf(BOT_TOKEN);

const COURSES = [
  "📚 Tarix",
  "⚖️ Huquq",
  "🇬🇧 Ingliz tili",
  "🇷🇺 Rus tili",
  "🤖 Sun'iy intellekt",
  "💻 IT | Kompyuter savodxonligi",
  "📖 Ona tili",
];

const TIMES = [
  "🕗 08:00 – 10:00",
  "🕙 10:00 – 12:00",
  "🕑 14:00 – 16:00",
  "🕓 16:00 – 18:00",
  "🕕 18:00 – 20:00",
];

async function showMainMenu(ctx: Context) {
  const keyboard = Markup.inlineKeyboard(
    COURSES.map((course) => [Markup.button.callback(course, `course_${course}`)]),
  );

  await ctx.reply(
    `👋 Assalomu alaykum! Men *Gallaorol Yoshlar Markazi*ning admin botiman.\n\n` +
      `📋 Sizga qanday yordam bera olaman?\n\n` +
      `Quyidagi kurslardan birini tanlang:`,
    {
      parse_mode: "Markdown",
      ...keyboard,
    },
  );
}

bot.start(async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  sessions.set(userId, { step: "start" });
  await showMainMenu(ctx);
});

COURSES.forEach((course) => {
  bot.action(`course_${course}`, async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from?.id;
    if (!userId) return;

    const session = getSession(userId);
    session.selectedCourse = course;
    session.step = "time";

    await ctx.editMessageText(
      `✅ Kurs tanlandi: *${course}*\n\n⏰ Endi qulay vaqtni tanlang:`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          ...TIMES.map((time) => [
            Markup.button.callback(time, `time_${time}`),
          ]),
          [Markup.button.callback("🔙 Orqaga", "back_to_courses")],
        ]),
      },
    );
  });
});

bot.action("back_to_courses", async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from?.id;
  if (!userId) return;

  await ctx.editMessageText(
    `📋 Kurslardan birini tanlang:`,
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard(
        COURSES.map((course) => [Markup.button.callback(course, `course_${course}`)]),
      ),
    },
  );
});

TIMES.forEach((time) => {
  bot.action(`time_${time}`, async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from?.id;
    if (!userId) return;

    const session = getSession(userId);
    session.selectedTime = time;
    session.step = "phone";

    await ctx.deleteMessage().catch(() => {});

    await ctx.reply(
      `✅ Vaqt tanlandi: *${time}*\n\n` +
        `📱 Endi telefon raqamingizni yuboring.\n\n` +
        `Quyidagi tugmani bosing yoki raqamni qo'lda kiriting (+998XXXXXXXXX formatida):`,
      {
        parse_mode: "Markdown",
        ...Markup.keyboard([
          [Markup.button.contactRequest("📱 Raqamni yuborish")],
        ])
          .resize()
          .oneTime(),
      },
    );
  });
});

bot.on("contact", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const session = getSession(userId);
  if (session.step !== "phone") return;

  const phone = ctx.message.contact.phone_number;
  session.phone = phone;
  session.step = "name";

  await ctx.reply(
    `✅ Telefon raqam qabul qilindi: *${phone}*\n\n` +
      `👤 Endi o'quvchining *Ism va Familiyasini* yuboring:\n\n` +
      `_(Masalan: Alisher Karimov)_`,
    {
      parse_mode: "Markdown",
      ...Markup.removeKeyboard(),
    },
  );
});

bot.on("message", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const session = getSession(userId);

  if (session.step === "phone" && "text" in ctx.message) {
    const text = ctx.message.text.trim();
    const phoneRegex = /^(\+998|998|0)\d{9}$/;
    if (!phoneRegex.test(text.replace(/\s/g, ""))) {
      await ctx.reply(
        `❌ Noto'g'ri format. Iltimos raqamni quyidagi formatda yuboring:\n*+998901234567*`,
        { parse_mode: "Markdown" },
      );
      return;
    }
    session.phone = text;
    session.step = "name";

    await ctx.reply(
      `✅ Telefon raqam qabul qilindi: *${text}*\n\n` +
        `👤 Endi o'quvchining *Ism va Familiyasini* yuboring:\n\n` +
        `_(Masalan: Alisher Karimov)_`,
      {
        parse_mode: "Markdown",
        ...Markup.removeKeyboard(),
      },
    );
    return;
  }

  if (session.step === "name" && "text" in ctx.message) {
    const name = ctx.message.text.trim();

    if (name.split(" ").length < 2) {
      await ctx.reply(
        `❌ Iltimos, *Ism va Familiyani* to'liq kiriting.\n_(Masalan: Alisher Karimov)_`,
        { parse_mode: "Markdown" },
      );
      return;
    }

    session.name = name;
    session.step = "done";

    const summary =
      `🎉 *Ro'yxatdan o'tish muvaffaqiyatli yakunlandi!*\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📚 *Kurs:* ${session.selectedCourse}\n` +
      `⏰ *Vaqt:* ${session.selectedTime}\n` +
      `📱 *Telefon:* ${session.phone}\n` +
      `👤 *Ism Familiya:* ${session.name}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `✅ Ma'lumotlaringiz qabul qilindi. Tez orada administrator siz bilan bog'lanadi!\n\n` +
      `🏢 *Gallaorol Yoshlar Markazi*`;

    await ctx.reply(summary, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🔄 Yana ro'yxatdan o'tish", "restart")],
      ]),
    });

    logger.info(
      {
        userId,
        name: session.name,
        course: session.selectedCourse,
        time: session.selectedTime,
        phone: session.phone,
      },
      "New registration",
    );

    const adminNotification =
      `📬 *Yangi ro'yxatdan o'tish!*\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📚 *Kurs:* ${session.selectedCourse}\n` +
      `⏰ *Vaqt:* ${session.selectedTime}\n` +
      `📱 *Telefon:* ${session.phone}\n` +
      `👤 *Ism Familiya:* ${session.name}\n` +
      `🆔 *Telegram ID:* ${userId}\n` +
      `━━━━━━━━━━━━━━━━━━━━`;

    await bot.telegram.sendMessage(ADMIN_ID, adminNotification, {
      parse_mode: "Markdown",
    }).catch((err) => {
      logger.warn({ err }, "Failed to send admin notification");
    });

    sessions.delete(userId);
    return;
  }
});

bot.action("restart", async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from?.id;
  if (!userId) return;

  sessions.set(userId, { step: "start" });
  await ctx.deleteMessage().catch(() => {});
  await showMainMenu(ctx);
});

bot.catch((err) => {
  logger.error({ err }, "Bot error");
});

export function startBot() {
  bot.launch();
  logger.info("Telegram bot started");

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}
