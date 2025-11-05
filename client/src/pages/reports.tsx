import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import type { Contact, Deal, Activity } from "@shared/schema";
import { FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { format, isWithinInterval, parseISO, differenceInDays } from "date-fns";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ReportType = "lead-activity" | "lead-pipeline" | "deal-pipeline" | "lapsed-contacts";

export default function Reports() {
  const [reportType, setReportType] = useState<ReportType>("lead-activity");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const { data: deals = [] } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
  });

  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const filterByDateRange = <T extends { createdAt: string | Date }>(items: T[]) => {
    if (!startDate || !endDate) return items;
    
    return items.filter(item => {
      const itemDate = typeof item.createdAt === 'string' ? parseISO(item.createdAt) : item.createdAt;
      return isWithinInterval(itemDate, {
        start: parseISO(startDate),
        end: parseISO(endDate)
      });
    });
  };

  const generateLeadActivityReport = () => {
    const filteredActivities = filterByDateRange(activities);
    const filteredContacts = filterByDateRange(contacts);
    const filteredDeals = filterByDateRange(deals);

    return {
      totalActivities: filteredActivities.length,
      newLeads: filteredContacts.length,
      closedDeals: filteredDeals.filter(d => d.stage === "closed").length,
      activities: filteredActivities.map(a => ({
        date: format(new Date(a.createdAt), "MMM dd, yyyy"),
        type: a.type,
        description: a.description,
        contact: contacts.find(c => c.id === a.contactId)?.leadOrProject || "Unknown",
      }))
    };
  };

  const generateLeadPipelineReport = () => {
    const filteredContacts = filterByDateRange(contacts);
    const totalPotential = filteredContacts.reduce((sum, c) => sum + Number(c.potentialValue || 0), 0);
    
    return {
      totalLeads: filteredContacts.length,
      totalPotential,
      leads: filteredContacts.map(c => ({
        name: c.leadOrProject,
        segment: c.segment,
        potentialValue: Number(c.potentialValue || 0),
        estRoomNights: c.estRoomNights || 0,
        dateAdded: format(new Date(c.createdAt), "MMM dd, yyyy"),
      }))
    };
  };

  const generateDealPipelineReport = () => {
    const filteredDeals = filterByDateRange(deals);
    const closedDeals = filteredDeals.filter(d => d.stage === "closed");
    const totalRevenue = closedDeals.reduce((sum, d) => sum + Number(d.value), 0);
    
    return {
      totalDeals: closedDeals.length,
      totalRevenue,
      deals: closedDeals.map(d => ({
        title: d.title,
        value: Number(d.value),
        stage: d.stage,
        contact: contacts.find(c => c.id === d.contactId)?.leadOrProject || "Unknown",
        dateClosed: format(new Date(d.createdAt), "MMM dd, yyyy"),
      }))
    };
  };

  const generateLapsedContactsReport = () => {
    const today = new Date();
    
    const contactsWithLastActivity = contacts.map(contact => {
      const contactActivities = activities.filter(a => a.contactId === contact.id);
      const lastActivity = contactActivities.length > 0
        ? contactActivities.reduce((latest, a) => {
            const aDate = new Date(a.createdAt);
            return aDate > latest ? aDate : latest;
          }, new Date(contactActivities[0].createdAt))
        : new Date(contact.createdAt);

      const daysSinceContact = differenceInDays(today, lastActivity);

      return {
        name: contact.leadOrProject,
        segment: contact.segment,
        lastContactDate: format(lastActivity, "MMM dd, yyyy"),
        daysSinceContact,
        primaryContact: contact.primaryContact || "-",
        email: contact.email || "-",
      };
    }).sort((a, b) => b.daysSinceContact - a.daysSinceContact);

    return {
      totalContacts: contactsWithLastActivity.length,
      lapsed30Plus: contactsWithLastActivity.filter(c => c.daysSinceContact > 30).length,
      lapsed60Plus: contactsWithLastActivity.filter(c => c.daysSinceContact > 60).length,
      contacts: contactsWithLastActivity,
    };
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(","),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToExcel = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const exportToPDF = (data: any[], filename: string, title: string) => {
    if (data.length === 0) return;

    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    
    // Add date range if applicable
    if (startDate && endDate) {
      doc.setFontSize(10);
      doc.text(`Date Range: ${format(parseISO(startDate), "MMM dd, yyyy")} - ${format(parseISO(endDate), "MMM dd, yyyy")}`, 14, 25);
    }

    // Convert data to table format
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(header => row[header]));

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: startDate && endDate ? 30 : 25,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 66, 66] },
    });

    doc.save(`${filename}.pdf`);
  };

  const renderReport = () => {
    switch (reportType) {
      case "lead-activity": {
        const report = generateLeadActivityReport();
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Total Activities</p>
                <p className="text-2xl font-bold">{report.totalActivities}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">New Leads</p>
                <p className="text-2xl font-bold">{report.newLeads}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Closed Deals</p>
                <p className="text-2xl font-bold">{report.closedDeals}</p>
              </Card>
            </div>
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Activity Details</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Contact</th>
                      <th className="text-left p-2">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.activities.map((activity, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2">{activity.date}</td>
                        <td className="p-2 capitalize">{activity.type}</td>
                        <td className="p-2">{activity.contact}</td>
                        <td className="p-2">{activity.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => exportToCSV(report.activities, "lead-activity-report")}
                  data-testid="button-export-csv"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={() => exportToExcel(report.activities, "lead-activity-report")}
                  data-testid="button-export-excel"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => exportToPDF(report.activities, "lead-activity-report", "Lead Activity Report")}
                  data-testid="button-export-pdf"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </Card>
          </div>
        );
      }

      case "lead-pipeline": {
        const report = generateLeadPipelineReport();
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{report.totalLeads}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Total Potential Revenue</p>
                <p className="text-2xl font-bold">${report.totalPotential.toLocaleString()}</p>
              </Card>
            </div>
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Lead Pipeline Details</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Lead Name</th>
                      <th className="text-left p-2">Segment</th>
                      <th className="text-left p-2">Est Room Nights</th>
                      <th className="text-left p-2">Potential Value</th>
                      <th className="text-left p-2">Date Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.leads.map((lead, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2">{lead.name}</td>
                        <td className="p-2">{lead.segment}</td>
                        <td className="p-2">{lead.estRoomNights}</td>
                        <td className="p-2">${lead.potentialValue.toLocaleString()}</td>
                        <td className="p-2">{lead.dateAdded}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => exportToCSV(report.leads, "lead-pipeline-report")}
                  data-testid="button-export-csv"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={() => exportToExcel(report.leads, "lead-pipeline-report")}
                  data-testid="button-export-excel"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => exportToPDF(report.leads, "lead-pipeline-report", "Lead Pipeline Potential Report")}
                  data-testid="button-export-pdf"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </Card>
          </div>
        );
      }

      case "deal-pipeline": {
        const report = generateDealPipelineReport();
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Total Closed Deals</p>
                <p className="text-2xl font-bold">{report.totalDeals}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${report.totalRevenue.toLocaleString()}</p>
              </Card>
            </div>
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Closed Deals</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Deal Title</th>
                      <th className="text-left p-2">Contact</th>
                      <th className="text-left p-2">Value</th>
                      <th className="text-left p-2">Date Closed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.deals.map((deal, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2">{deal.title}</td>
                        <td className="p-2">{deal.contact}</td>
                        <td className="p-2">${deal.value.toLocaleString()}</td>
                        <td className="p-2">{deal.dateClosed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => exportToCSV(report.deals, "deal-pipeline-report")}
                  data-testid="button-export-csv"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={() => exportToExcel(report.deals, "deal-pipeline-report")}
                  data-testid="button-export-excel"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => exportToPDF(report.deals, "deal-pipeline-report", "Deal Pipeline Report")}
                  data-testid="button-export-pdf"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </Card>
          </div>
        );
      }

      case "lapsed-contacts": {
        const report = generateLapsedContactsReport();
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Total Contacts</p>
                <p className="text-2xl font-bold">{report.totalContacts}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Lapsed 30+ Days</p>
                <p className="text-2xl font-bold">{report.lapsed30Plus}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Lapsed 60+ Days</p>
                <p className="text-2xl font-bold">{report.lapsed60Plus}</p>
              </Card>
            </div>
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Lapsed Contact Details</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Lead Name</th>
                      <th className="text-left p-2">Segment</th>
                      <th className="text-left p-2">Last Contact</th>
                      <th className="text-left p-2">Days Since Contact</th>
                      <th className="text-left p-2">Primary Contact</th>
                      <th className="text-left p-2">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.contacts.map((contact, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2">{contact.name}</td>
                        <td className="p-2">{contact.segment}</td>
                        <td className="p-2">{contact.lastContactDate}</td>
                        <td className="p-2 font-bold">{contact.daysSinceContact}</td>
                        <td className="p-2">{contact.primaryContact}</td>
                        <td className="p-2">{contact.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => exportToCSV(report.contacts, "lapsed-contacts-report")}
                  data-testid="button-export-csv"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={() => exportToExcel(report.contacts, "lapsed-contacts-report")}
                  data-testid="button-export-excel"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => exportToPDF(report.contacts, "lapsed-contacts-report", "Lapsed Contacts Report")}
                  data-testid="button-export-pdf"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </Card>
          </div>
        );
      }
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">
          Generate and export reports for your CRM data
        </p>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="report-type">Report Type</Label>
            <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
              <SelectTrigger id="report-type" data-testid="select-report-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead-activity">Lead Activity</SelectItem>
                <SelectItem value="lead-pipeline">Lead Pipeline Potential</SelectItem>
                <SelectItem value="deal-pipeline">Deal Pipeline</SelectItem>
                <SelectItem value="lapsed-contacts">Lapsed Contacts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              data-testid="input-start-date"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              data-testid="input-end-date"
            />
          </div>

          <div className="flex items-end">
            <Button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              variant="outline"
              className="w-full"
              data-testid="button-clear-dates"
            >
              Clear Dates
            </Button>
          </div>
        </div>
      </Card>

      {renderReport()}
    </div>
  );
}
