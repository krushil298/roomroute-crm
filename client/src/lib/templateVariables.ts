import type { Contact, Deal, Organization, User } from "@shared/schema";
import { format } from "date-fns";

export interface TemplateContext {
  organization?: Organization;
  contact?: Contact;
  deal?: Deal;
  user?: User;
}

export const TEMPLATE_VARIABLES = {
  // Hotel/Organization variables
  HOTEL_LEGAL_NAME: "{{hotel_legal_name}}",
  HOTEL_BRAND_NAME: "{{hotel_brand_name}}",
  HOTEL_NAME: "{{hotel_name}}",
  HOTEL_ADDRESS: "{{hotel_address}}",
  HOTEL_CITY: "{{hotel_city}}",
  HOTEL_STATE: "{{hotel_state}}",
  HOTEL_ZIP: "{{hotel_zip}}",
  HOTEL_FULL_ADDRESS: "{{hotel_full_address}}",
  HOTEL_CONTACT_NAME: "{{hotel_contact_name}}",
  HOTEL_CONTACT_EMAIL: "{{hotel_contact_email}}",
  HOTEL_CONTACT_PHONE: "{{hotel_contact_phone}}",
  
  // Contact/Company variables
  COMPANY_LEGAL_NAME: "{{company_legal_name}}",
  COMPANY_NAME: "{{company_name}}",
  COMPANY_ADDRESS: "{{company_address}}",
  COMPANY_CITY: "{{company_city}}",
  COMPANY_STATE: "{{company_state}}",
  COMPANY_ZIP: "{{company_zip}}",
  COMPANY_FULL_ADDRESS: "{{company_full_address}}",
  
  // Contact person variables
  FIRST_NAME: "{{first_name}}",
  LAST_NAME: "{{last_name}}",
  FULL_NAME: "{{full_name}}",
  CONTACT_EMAIL: "{{contact_email}}",
  CONTACT_PHONE: "{{contact_phone}}",
  
  // User/Salesperson variables
  YOUR_NAME: "{{your_name}}",
  YOUR_FIRST_NAME: "{{your_first_name}}",
  YOUR_EMAIL: "{{your_email}}",
  YOUR_TITLE: "{{your_title}}",
  YOUR_MOBILE: "{{your_mobile}}",
  
  // Deal variables
  EVENT_NAME: "{{event_name}}",
  EVENT_DATES: "{{event_dates}}",
  DEAL_VALUE: "{{deal_value}}",
  
  // Date placeholders (to be filled manually)
  DATE: "{{date}}",
  EFFECTIVE_DATE: "{{effective_date}}",
  EXPIRATION_DATE: "{{expiration_date}}",
  CUT_OFF_DATE: "{{cut_off_date}}",
};

export function replaceTemplateVariables(
  template: string,
  context: TemplateContext
): string {
  let result = template;
  
  const { organization, contact, deal, user } = context;
  
  // Replace organization/hotel variables
  if (organization) {
    result = result.replace(/\{\{hotel_legal_name\}\}/g, organization.legalName || organization.name || "[HOTEL LEGAL NAME]");
    result = result.replace(/\{\{hotel_brand_name\}\}/g, organization.brandName || organization.name || "[HOTEL BRAND/PROPERTY NAME]");
    result = result.replace(/\{\{hotel_name\}\}/g, organization.name || "[HOTEL NAME]");
    result = result.replace(/\{\{hotel_address\}\}/g, organization.address || "[HOTEL ADDRESS]");
    result = result.replace(/\{\{hotel_city\}\}/g, organization.city || "[CITY]");
    result = result.replace(/\{\{hotel_state\}\}/g, organization.state || "[STATE]");
    result = result.replace(/\{\{hotel_zip\}\}/g, organization.zipCode || "[ZIP]");
    
    const fullAddress = [
      organization.address,
      organization.city,
      organization.state,
      organization.zipCode
    ].filter(Boolean).join(", ") || "[HOTEL FULL ADDRESS]";
    result = result.replace(/\{\{hotel_full_address\}\}/g, fullAddress);
    
    result = result.replace(/\{\{hotel_contact_name\}\}/g, organization.contactName || "[CONTACT NAME]");
    result = result.replace(/\{\{hotel_contact_email\}\}/g, organization.contactEmail || "[CONTACT EMAIL]");
    result = result.replace(/\{\{hotel_contact_phone\}\}/g, organization.contactPhone || "[CONTACT PHONE]");
  }
  
  // Replace contact/company variables
  if (contact) {
    result = result.replace(/\{\{company_legal_name\}\}/g, contact.company || "[COMPANY LEGAL NAME]");
    result = result.replace(/\{\{company_name\}\}/g, contact.company || "[COMPANY NAME]");
    result = result.replace(/\{\{company_address\}\}/g, contact.companyAddress || "[COMPANY ADDRESS]");
    result = result.replace(/\{\{company_city\}\}/g, contact.companyCity || "[COMPANY CITY]");
    result = result.replace(/\{\{company_state\}\}/g, contact.companyState || "[COMPANY STATE]");
    result = result.replace(/\{\{company_zip\}\}/g, contact.companyZipCode || "[COMPANY ZIP]");
    
    const companyFullAddress = [
      contact.companyAddress,
      contact.companyCity,
      contact.companyState,
      contact.companyZipCode
    ].filter(Boolean).join(", ") || "[COMPANY FULL ADDRESS]";
    result = result.replace(/\{\{company_full_address\}\}/g, companyFullAddress);
    
    // Contact person details
    const names = (contact.primaryContact || "").split(" ");
    const firstName = names[0] || "[FIRST NAME]";
    const lastName = names.slice(1).join(" ") || "[LAST NAME]";
    
    result = result.replace(/\{\{first_name\}\}/g, firstName);
    result = result.replace(/\{\{last_name\}\}/g, lastName);
    result = result.replace(/\{\{full_name\}\}/g, contact.primaryContact || "[FULL NAME]");
    result = result.replace(/\{\{contact_email\}\}/g, contact.email || "[CONTACT EMAIL]");
    result = result.replace(/\{\{contact_phone\}\}/g, contact.phone || "[CONTACT PHONE]");
  }
  
  // Replace user/salesperson variables
  if (user) {
    result = result.replace(/\{\{your_name\}\}/g, `${user.firstName || ""} ${user.lastName || ""}`.trim() || "[YOUR NAME]");
    result = result.replace(/\{\{your_first_name\}\}/g, user.firstName || "[YOUR FIRST NAME]");
    result = result.replace(/\{\{your_email\}\}/g, user.email || "[YOUR EMAIL]");
    result = result.replace(/\{\{your_title\}\}/g, "[YOUR TITLE]"); // Can add to user schema if needed
    result = result.replace(/\{\{your_mobile\}\}/g, "[YOUR MOBILE]"); // Can add to user schema if needed
  }
  
  // Replace deal variables
  if (deal) {
    result = result.replace(/\{\{event_name\}\}/g, deal.title || "[EVENT NAME]");
    result = result.replace(/\{\{deal_value\}\}/g, deal.value ? `$${deal.value}` : "[DEAL VALUE]");
    
    if (deal.expectedCloseDate) {
      const eventDate = new Date(deal.expectedCloseDate);
      result = result.replace(/\{\{event_dates\}\}/g, format(eventDate, "MMMM d, yyyy"));
    } else {
      result = result.replace(/\{\{event_dates\}\}/g, "[EVENT DATES]");
    }
  }
  
  // Leave date placeholders for manual entry
  // These will remain as {{date}}, {{effective_date}}, etc. for user to fill in
  
  return result;
}

export function getAvailableVariables(context: TemplateContext): string[] {
  const variables: string[] = [];
  
  const { organization, contact, deal, user } = context;
  
  if (organization) {
    variables.push(
      "{{hotel_legal_name}}", "{{hotel_brand_name}}", "{{hotel_name}}",
      "{{hotel_address}}", "{{hotel_city}}", "{{hotel_state}}", "{{hotel_zip}}",
      "{{hotel_full_address}}", "{{hotel_contact_name}}", "{{hotel_contact_email}}",
      "{{hotel_contact_phone}}"
    );
  }
  
  if (contact) {
    variables.push(
      "{{company_legal_name}}", "{{company_name}}", "{{company_address}}",
      "{{company_city}}", "{{company_state}}", "{{company_zip}}",
      "{{company_full_address}}", "{{first_name}}", "{{last_name}}",
      "{{full_name}}", "{{contact_email}}", "{{contact_phone}}"
    );
  }
  
  if (user) {
    variables.push(
      "{{your_name}}", "{{your_first_name}}", "{{your_email}}",
      "{{your_title}}", "{{your_mobile}}"
    );
  }
  
  if (deal) {
    variables.push("{{event_name}}", "{{event_dates}}", "{{deal_value}}");
  }
  
  // Always include manual date placeholders
  variables.push(
    "{{date}}", "{{effective_date}}", "{{expiration_date}}", "{{cut_off_date}}"
  );
  
  return variables;
}
