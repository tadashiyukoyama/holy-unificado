import { pgTable, uuid, text, integer, boolean, timestamp, date, time, jsonb, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    phone: text("phone"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  t => ({
    phoneIdx: index("customers_phone_idx").on(t.phone),
    nameIdx: index("customers_name_idx").on(t.name),
  })
);

export const diningRooms = pgTable("dining_rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  width: integer("width").notNull().default(900),
  height: integer("height").notNull().default(560),
  background: text("background"), // optional image url
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tables = pgTable(
  "tables",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id").references(() => diningRooms.id, { onDelete: "set null" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    capacity: integer("capacity").notNull().default(2),
    shape: text("shape").notNull().default("round"), // round|rect
    status: text("status").notNull().default("available"), // available|blocked|out_of_service
    isActive: boolean("is_active").notNull().default(true),

    x: integer("x").notNull().default(10),
    y: integer("y").notNull().default(10),
    w: integer("w").notNull().default(90),
    h: integer("h").notNull().default(90),
    rotation: integer("rotation").notNull().default(0),

    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  t => ({
    roomIdx: index("tables_room_idx").on(t.roomId),
    codeIdx: index("tables_code_idx").on(t.code),
  })
);

export const reservations = pgTable(
  "reservations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone"),
    reservationDate: date("reservation_date").notNull(),
    reservationTime: time("reservation_time").notNull(),
    partySize: integer("party_size").notNull().default(2),
    status: text("status").notNull().default("pending"), // pending|confirmed|cancelled|completed|no_show
    tableId: uuid("table_id").references(() => tables.id, { onDelete: "set null" }),
    notes: text("notes"),
    source: text("source").notNull().default("manual"), // manual|waitlist|whatsapp|web
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  t => ({
    dateIdx: index("reservations_date_idx").on(t.reservationDate),
    tableIdx: index("reservations_table_idx").on(t.tableId),
  })
);

export const waitlist = pgTable(
  "waitlist",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone"),
    partySize: integer("party_size").notNull().default(2),
    status: text("status").notNull().default("waiting"), // waiting|contacted|seated|cancelled
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  t => ({
    statusIdx: index("waitlist_status_idx").on(t.status),
  })
);

export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  description: text("description"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const restaurantEvents = pgTable("restaurant_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  eventDate: date("event_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Support/Agent tables (subset inspired by app2)
export const supportAudit = pgTable("support_audit", {
  id: uuid("id").primaryKey().defaultRandom(),
  actor: text("actor").notNull().default("system"),
  action: text("action").notNull(),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const supportMessages = pgTable("support_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: text("session_id").notNull(),
  role: text("role").notNull(), // user|assistant|tool
  content: text("content").notNull(),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const memoryShort = pgTable("memory_short", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const memoryLong = pgTable("memory_long", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
