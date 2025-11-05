import {
  type User,
  type UpsertUser,
  type Contact,
  type InsertContact,
  type Deal,
  type InsertDeal,
  type Activity,
  type InsertActivity,
  type ContractTemplate,
  type InsertContractTemplate,
  type EmailTemplate,
  type InsertEmailTemplate,
  type Organization,
  type InsertOrganization,
  type UserOrganization,
  type InsertUserOrganization,
  users,
  contacts,
  deals,
  activities,
  contractTemplates,
  emailTemplates,
  organizations,
  userOrganizations,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(userId: string, role: string): Promise<User | undefined>;
  updateUserCurrentOrg(userId: string, orgId: string): Promise<User | undefined>;
  
  // Organization operations
  getOrganization(id: string): Promise<Organization | undefined>;
  getAllOrganizations(): Promise<Organization[]>;
  getAllOrganizationsIncludingArchived(): Promise<Organization[]>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, data: Partial<Organization>): Promise<Organization | undefined>;
  updateUserOrganization(userId: string, organizationId: string): Promise<User | undefined>;
  
  // User-Organization operations (multi-tenant)
  getUserOrganizations(userId: string): Promise<UserOrganization[]>;
  getOrganizationUsers(organizationId: string): Promise<any[]>; // Returns joined data with user details
  getDeactivatedUsers(): Promise<any[]>; // Returns all deactivated users across all orgs
  addUserToOrganization(data: InsertUserOrganization): Promise<UserOrganization>;
  removeUserFromOrganization(userId: string, organizationId: string): Promise<void>;
  updateUserOrganizationStatus(userId: string, organizationId: string, active: boolean): Promise<any>;
  
  // Contact operations (filtered by organization)
  getAllContacts(organizationId: string): Promise<Contact[]>;
  getContact(id: string, organizationId: string): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: string, organizationId: string, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: string, organizationId: string): Promise<void>;
  importContacts(contacts: InsertContact[]): Promise<Contact[]>;
  
  // Deal operations (filtered by organization)
  getAllDeals(organizationId: string): Promise<Deal[]>;
  getDeal(id: string, organizationId: string): Promise<Deal | undefined>;
  getDealsByContact(contactId: string, organizationId: string): Promise<Deal[]>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: string, organizationId: string, deal: Partial<InsertDeal>): Promise<Deal | undefined>;
  deleteDeal(id: string, organizationId: string): Promise<void>;
  
  // Activity operations (filtered by organization)
  getAllActivities(organizationId: string): Promise<Activity[]>;
  getActivitiesByContact(contactId: string, organizationId: string): Promise<Activity[]>;
  getActivitiesByDeal(dealId: string, organizationId: string): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Template operations (filtered by organization)
  getAllContractTemplates(organizationId: string): Promise<ContractTemplate[]>;
  getContractTemplate(id: string, organizationId: string): Promise<ContractTemplate | undefined>;
  getContractTemplatesByType(type: string, organizationId: string): Promise<ContractTemplate[]>;
  createContractTemplate(template: InsertContractTemplate): Promise<ContractTemplate>;
  updateContractTemplate(id: string, organizationId: string, template: Partial<InsertContractTemplate>): Promise<ContractTemplate | undefined>;
  deleteContractTemplate(id: string, organizationId: string): Promise<void>;
  
  getAllEmailTemplates(organizationId: string): Promise<EmailTemplate[]>;
  getEmailTemplate(id: string, organizationId: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: string, organizationId: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: string, organizationId: string): Promise<void>;
}

export class DbStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // First try to find existing user by ID or email
    const existingById = await db.select().from(users).where(eq(users.id, userData.id!)).limit(1);
    const existingByEmail = userData.email 
      ? await db.select().from(users).where(eq(users.email, userData.email)).limit(1)
      : [];
    
    const existing = existingById[0] || existingByEmail[0];
    
    if (existing) {
      // Update existing user
      const [updated] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing.id))
        .returning();
      return updated;
    } else {
      // Insert new user
      const [user] = await db.insert(users).values(userData).returning();
      return user;
    }
  }

  // Organization operations
  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }

  async createOrganization(orgData: InsertOrganization): Promise<Organization> {
    const [org] = await db.insert(organizations).values(orgData).returning();
    return org;
  }

  async updateOrganization(id: string, data: Partial<Organization>): Promise<Organization | undefined> {
    const [org] = await db
      .update(organizations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return org;
  }

  async updateUserOrganization(userId: string, organizationId: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ organizationId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserRole(userId: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserCurrentOrg(userId: string, orgId: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ currentOrganizationId: orgId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getAllOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations).where(eq(organizations.active, true));
  }

  async getAllOrganizationsIncludingArchived(): Promise<Organization[]> {
    return await db.select().from(organizations);
  }

  // User-Organization operations
  async getUserOrganizations(userId: string): Promise<UserOrganization[]> {
    return await db.select().from(userOrganizations).where(eq(userOrganizations.userId, userId));
  }

  async getOrganizationUsers(organizationId: string): Promise<any[]> {
    // Join with users table to get complete user information
    const results = await db
      .select({
        userId: userOrganizations.userId,
        organizationId: userOrganizations.organizationId,
        role: userOrganizations.role,
        active: userOrganizations.active,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(userOrganizations)
      .leftJoin(users, eq(userOrganizations.userId, users.id))
      .where(eq(userOrganizations.organizationId, organizationId));
    
    return results;
  }

  async addUserToOrganization(data: InsertUserOrganization): Promise<UserOrganization> {
    const [userOrg] = await db.insert(userOrganizations).values(data).returning();
    return userOrg;
  }

  async removeUserFromOrganization(userId: string, organizationId: string): Promise<void> {
    // Soft delete: set active to false instead of hard deleting
    await db.update(userOrganizations)
      .set({ active: false })
      .where(
        and(eq(userOrganizations.userId, userId), eq(userOrganizations.organizationId, organizationId))
      );
  }

  async getDeactivatedUsers(): Promise<any[]> {
    const results = await db
      .select({
        userId: userOrganizations.userId,
        organizationId: userOrganizations.organizationId,
        role: userOrganizations.role,
        active: userOrganizations.active,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        orgName: organizations.name,
      })
      .from(userOrganizations)
      .leftJoin(users, eq(userOrganizations.userId, users.id))
      .leftJoin(organizations, eq(userOrganizations.organizationId, organizations.id))
      .where(eq(userOrganizations.active, false));
    
    return results;
  }

  async updateUserOrganizationStatus(userId: string, organizationId: string, active: boolean): Promise<any> {
    await db.update(userOrganizations)
      .set({ active })
      .where(
        and(eq(userOrganizations.userId, userId), eq(userOrganizations.organizationId, organizationId))
      );
    return { success: true };
  }
  
  // Contact operations
  async getAllContacts(organizationId: string): Promise<Contact[]> {
    return await db.select().from(contacts).where(eq(contacts.organizationId, organizationId));
  }
  
  async getContact(id: string, organizationId: string): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(
      and(eq(contacts.id, id), eq(contacts.organizationId, organizationId))
    );
    return contact;
  }
  
  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }
  
  async updateContact(id: string, organizationId: string, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    const [updated] = await db.update(contacts).set(contact).where(
      and(eq(contacts.id, id), eq(contacts.organizationId, organizationId))
    ).returning();
    return updated;
  }
  
  async deleteContact(id: string, organizationId: string): Promise<void> {
    await db.delete(contacts).where(
      and(eq(contacts.id, id), eq(contacts.organizationId, organizationId))
    );
  }
  
  async importContacts(contactsList: InsertContact[]): Promise<Contact[]> {
    if (contactsList.length === 0) return [];
    return await db.insert(contacts).values(contactsList).returning();
  }
  
  // Deal operations
  async getAllDeals(organizationId: string): Promise<Deal[]> {
    return await db.select().from(deals).where(eq(deals.organizationId, organizationId));
  }
  
  async getDeal(id: string, organizationId: string): Promise<Deal | undefined> {
    const [deal] = await db.select().from(deals).where(
      and(eq(deals.id, id), eq(deals.organizationId, organizationId))
    );
    return deal;
  }
  
  async getDealsByContact(contactId: string, organizationId: string): Promise<Deal[]> {
    return await db.select().from(deals).where(
      and(eq(deals.contactId, contactId), eq(deals.organizationId, organizationId))
    );
  }
  
  async createDeal(deal: InsertDeal): Promise<Deal> {
    const [newDeal] = await db.insert(deals).values(deal).returning();
    return newDeal;
  }
  
  async updateDeal(id: string, organizationId: string, deal: Partial<InsertDeal>): Promise<Deal | undefined> {
    const [updated] = await db.update(deals).set(deal).where(
      and(eq(deals.id, id), eq(deals.organizationId, organizationId))
    ).returning();
    return updated;
  }
  
  async deleteDeal(id: string, organizationId: string): Promise<void> {
    await db.delete(deals).where(
      and(eq(deals.id, id), eq(deals.organizationId, organizationId))
    );
  }
  
  // Activity operations
  async getAllActivities(organizationId: string): Promise<Activity[]> {
    return await db.select().from(activities).where(eq(activities.organizationId, organizationId));
  }
  
  async getActivitiesByContact(contactId: string, organizationId: string): Promise<Activity[]> {
    return await db.select().from(activities).where(
      and(eq(activities.contactId, contactId), eq(activities.organizationId, organizationId))
    );
  }
  
  async getActivitiesByDeal(dealId: string, organizationId: string): Promise<Activity[]> {
    return await db.select().from(activities).where(
      and(eq(activities.dealId, dealId), eq(activities.organizationId, organizationId))
    );
  }
  
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }
  
  // Contract template operations
  async getAllContractTemplates(organizationId: string): Promise<ContractTemplate[]> {
    return await db.select().from(contractTemplates).where(eq(contractTemplates.organizationId, organizationId));
  }
  
  async getContractTemplate(id: string, organizationId: string): Promise<ContractTemplate | undefined> {
    const [template] = await db.select().from(contractTemplates).where(
      and(eq(contractTemplates.id, id), eq(contractTemplates.organizationId, organizationId))
    );
    return template;
  }
  
  async getContractTemplatesByType(type: string, organizationId: string): Promise<ContractTemplate[]> {
    return await db.select().from(contractTemplates).where(
      and(eq(contractTemplates.type, type), eq(contractTemplates.organizationId, organizationId))
    );
  }
  
  async createContractTemplate(template: InsertContractTemplate): Promise<ContractTemplate> {
    const [newTemplate] = await db.insert(contractTemplates).values(template).returning();
    return newTemplate;
  }
  
  async updateContractTemplate(id: string, organizationId: string, template: Partial<InsertContractTemplate>): Promise<ContractTemplate | undefined> {
    const [updated] = await db.update(contractTemplates).set({
      ...template,
      updatedAt: new Date(),
    }).where(
      and(eq(contractTemplates.id, id), eq(contractTemplates.organizationId, organizationId))
    ).returning();
    return updated;
  }
  
  async deleteContractTemplate(id: string, organizationId: string): Promise<void> {
    await db.delete(contractTemplates).where(
      and(eq(contractTemplates.id, id), eq(contractTemplates.organizationId, organizationId))
    );
  }
  
  // Email template operations
  async getAllEmailTemplates(organizationId: string): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates).where(eq(emailTemplates.organizationId, organizationId));
  }
  
  async getEmailTemplate(id: string, organizationId: string): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(
      and(eq(emailTemplates.id, id), eq(emailTemplates.organizationId, organizationId))
    );
    return template;
  }
  
  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [newTemplate] = await db.insert(emailTemplates).values(template).returning();
    return newTemplate;
  }
  
  async updateEmailTemplate(id: string, organizationId: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined> {
    const [updated] = await db.update(emailTemplates).set({
      ...template,
      updatedAt: new Date(),
    }).where(
      and(eq(emailTemplates.id, id), eq(emailTemplates.organizationId, organizationId))
    ).returning();
    return updated;
  }
  
  async deleteEmailTemplate(id: string, organizationId: string): Promise<void> {
    await db.delete(emailTemplates).where(
      and(eq(emailTemplates.id, id), eq(emailTemplates.organizationId, organizationId))
    );
  }
}

export const storage = new DbStorage();
