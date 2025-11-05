import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal, boolean, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  organizationId: varchar("organization_id").references(() => organizations.id), // Legacy: primary org
  role: text("role").notNull().default("user"), // Global role: user, admin, super_admin
  currentOrganizationId: varchar("current_organization_id"), // For users in multiple orgs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Junction table for multi-org support
export const userOrganizations = pgTable("user_organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  role: text("role").notNull().default("user"), // Role within this org: user, admin
  active: boolean("active").notNull().default(true), // Soft delete capability
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type UserOrganization = typeof userOrganizations.$inferSelect;
export type InsertUserOrganization = typeof userOrganizations.$inferInsert;

// Organizations table for multi-tenancy
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  // Hotel Profile Information
  numberOfRooms: integer("number_of_rooms"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country"),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  hasMeetingRooms: boolean("has_meeting_rooms").default(false),
  meetingRoomCapacity: integer("meeting_room_capacity"),
  meetingRoomDetails: text("meeting_room_details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).optional(),
  numberOfRooms: z.preprocess(
    (val) => val === "" || val === null || val === undefined ? null : Number(val),
    z.number().int().positive().nullable().optional()
  ),
  address: z.string().optional().or(z.literal("")).nullable(),
  city: z.string().optional().or(z.literal("")).nullable(),
  state: z.string().optional().or(z.literal("")).nullable(),
  zipCode: z.string().optional().or(z.literal("")).nullable(),
  country: z.string().optional().or(z.literal("")).nullable(),
  contactName: z.string().optional().or(z.literal("")).nullable(),
  contactPhone: z.string().optional().or(z.literal("")).nullable(),
  contactEmail: z.string().email().optional().or(z.literal("")).nullable(),
  hasMeetingRooms: z.boolean().optional(),
  meetingRoomCapacity: z.preprocess(
    (val) => val === "" || val === null || val === undefined ? null : Number(val),
    z.number().int().positive().nullable().optional()
  ),
  meetingRoomDetails: z.string().optional().or(z.literal("")).nullable(),
});

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type UpdateOrganization = z.infer<typeof updateOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  leadOrProject: text("lead_or_project").notNull(),
  company: text("company"),
  segment: text("segment").notNull(),
  primaryContact: text("primary_contact"),
  phone: text("phone"),
  email: text("email"),
  estRoomNights: integer("est_room_nights"),
  potentialValue: decimal("potential_value", { precision: 10, scale: 2 }),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Client schema - used by frontend (organizationId omitted for security)
export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  organizationId: true,
});

// Server schema - includes organizationId for database insertion
const insertContactSchemaWithOrg = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
});

export type InsertContact = z.infer<typeof insertContactSchemaWithOrg>;
export type ClientInsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

export const deals = pgTable("deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  contactId: varchar("contact_id").references(() => contacts.id),
  title: text("title").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  stage: text("stage").notNull().default("lead"),
  probability: integer("probability").notNull().default(0),
  expectedCloseDate: timestamp("expected_close_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Client schema - used by frontend (organizationId omitted for security)
export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  createdAt: true,
  organizationId: true,
});

// Server schema - includes organizationId for database insertion
const insertDealSchemaWithOrg = createInsertSchema(deals).omit({
  id: true,
  createdAt: true,
});

export type InsertDeal = z.infer<typeof insertDealSchemaWithOrg>;
export type ClientInsertDeal = z.infer<typeof insertDealSchema>;
export type Deal = typeof deals.$inferSelect;

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  contactId: varchar("contact_id").references(() => contacts.id),
  dealId: varchar("deal_id").references(() => deals.id),
  type: text("type").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
}).extend({
  description: z.string().optional(),
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

export const contractTemplates = pgTable("contract_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertContractTemplateSchema = createInsertSchema(contractTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertContractTemplate = z.infer<typeof insertContractTemplateSchema>;
export type ContractTemplate = typeof contractTemplates.$inferSelect;

export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
