import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ---------- Auth.js standard tables ----------

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// ---------- Domain ----------

export const expenseLines = pgTable("expense_line", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category"),
  defaultProjectedCents: integer("default_projected_cents").notNull().default(0),
  dueDay: smallint("due_day").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  isArchived: boolean("is_archived").notNull().default(false),
  defaultPaidWithCard: boolean("default_paid_with_card")
    .notNull()
    .default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const allowedEmails = pgTable("allowed_email", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  invitedById: text("invited_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const pushSubscriptions = pgTable("push_subscription", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const expenseLineValues = pgTable(
  "expense_line_value",
  {
    id: serial("id").primaryKey(),
    lineId: integer("line_id")
      .notNull()
      .references(() => expenseLines.id, { onDelete: "cascade" }),
    effectiveYear: integer("effective_year").notNull(),
    effectiveMonth: smallint("effective_month").notNull(),
    projectedCents: integer("projected_cents").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("expense_line_value_line_year_month_idx").on(
      t.lineId,
      t.effectiveYear,
      t.effectiveMonth,
    ),
  ],
);

export const monthlyEntries = pgTable(
  "monthly_entry",
  {
    id: serial("id").primaryKey(),
    lineId: integer("line_id")
      .notNull()
      .references(() => expenseLines.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    month: smallint("month").notNull(),
    projectedCents: integer("projected_cents").notNull().default(0),
    actualCents: integer("actual_cents"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    paidWithCard: boolean("paid_with_card").notNull().default(false),
    dueDay: smallint("due_day"),
    notes: text("notes"),
    updatedById: text("updated_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("monthly_entry_line_year_month_idx").on(
      t.lineId,
      t.year,
      t.month,
    ),
  ],
);

export type ExpenseLine = typeof expenseLines.$inferSelect;
export type NewExpenseLine = typeof expenseLines.$inferInsert;
export type MonthlyEntry = typeof monthlyEntries.$inferSelect;
export type NewMonthlyEntry = typeof monthlyEntries.$inferInsert;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
export type AllowedEmail = typeof allowedEmails.$inferSelect;
export type NewAllowedEmail = typeof allowedEmails.$inferInsert;
