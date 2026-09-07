import {
  pgTable, pgEnum, uuid, text, integer, date, timestamp, index,
} from "drizzle-orm/pg-core";

export const recurringIntervalEnum = pgEnum("recurring_interval", [
  "monthly", "quarterly", "yearly",
]);
export const incomeStatusEnum = pgEnum("income_status", [
  "expected", "invoiced", "settled", "written_off",
]);
export const rebillStatusEnum = pgEnum("rebill_status", [
  "internal", "rebillable", "rebilled", "settled",
]);
export const engagementStatusEnum = pgEnum("engagement_status", [
  "active", "paused", "ended",
]);

const timestamps = {
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
};

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  baseCurrency: text("base_currency").notNull().default("DKK"),
  ...timestamps,
});

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  notes: text("notes"),
  ...timestamps,
}, (t) => [index("clients_org_idx").on(t.orgId)]);

export const engagements = pgTable("engagements", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  name: text("name").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  status: engagementStatusEnum("status").notNull().default("active"),
  ...timestamps,
}, (t) => [index("engagements_org_client_idx").on(t.orgId, t.clientId)]);

export const income = pgTable("income", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  engagementId: uuid("engagement_id").references(() => engagements.id),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("DKK"),
  fxRate: text("fx_rate").notNull().default("1"),
  amountDkk: integer("amount_dkk").notNull(),
  date: date("date").notNull(),
  recurringInterval: recurringIntervalEnum("recurring_interval"),
  status: incomeStatusEnum("status").notNull().default("expected"),
  ...timestamps,
}, (t) => [index("income_org_client_date_idx").on(t.orgId, t.clientId, t.date)]);

export const outlays = pgTable("outlays", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  engagementId: uuid("engagement_id").references(() => engagements.id),
  vendor: text("vendor").notNull(),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("DKK"),
  fxRate: text("fx_rate").notNull().default("1"),
  amountDkk: integer("amount_dkk").notNull(),
  date: date("date").notNull(),
  rebillStatus: rebillStatusEnum("rebill_status").notNull().default("internal"),
  rebilledAt: date("rebilled_at"),
  settledAt: date("settled_at"),
  ...timestamps,
}, (t) => [
  index("outlays_org_client_date_idx").on(t.orgId, t.clientId, t.date),
  index("outlays_rebill_idx").on(t.orgId, t.rebillStatus),
]);
