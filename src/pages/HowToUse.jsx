import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Zap, Download, Settings, AlertCircle } from "lucide-react";

export default function HowToUse() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-3">How to Use Invoice Generator</h1>
          <p className="text-lg text-muted-foreground">A quick guide to getting started with creating professional invoices</p>
        </div>

        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-accent" />
              Quick Start in 5 Minutes
            </CardTitle>
            <CardDescription>Get your first invoice created and downloaded</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-foreground">
            <p>1. <strong>Add Clients (Optional but Recommended):</strong> Go to the "Clients" tab to create and save client information for quick access later. You can also enter client details manually in each invoice.</p>
            <p>2. <strong>Create Your First Invoice:</strong> Return to the home page. The Boat Clinic Invoice uses a line-item format — add as many service line items as you need with descriptions, quantities, and unit prices.</p>
            <p>3. <strong>Fill in the Details:</strong> Click the "Edit" button to open the form. Select or create a client, add your company info, set dates, and configure pricing. Your changes update the preview instantly.</p>
            <p>4. <strong>Download as PDF:</strong> Once you're happy with the invoice, click "Download PDF" to save it to your device. It's automatically added to your invoice history.</p>
            <p>5. <strong>Create More Invoices:</strong> Need to invoice multiple clients? Use "Bulk Generate" to create invoices for several clients at once.</p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Create Invoices
              </CardTitle>
              <CardDescription>Home Page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-foreground"><strong>Boat Clinic Invoice:</strong> A flexible line-item invoice format — add as many service items as you need, each with its own description, quantity, and unit price.</p>
              </div>
              <div className="bg-secondary/20 p-4 rounded border border-border space-y-3 text-xs text-muted-foreground">
                <p><strong>How to Create an Invoice:</strong></p>
                <ol className="list-decimal list-inside space-y-2">
                  <li><strong>Click "Edit"</strong> to open the invoice form</li>
                  <li><strong>Select a Client</strong> from the dropdown, or enter details manually</li>
                  <li><strong>Set the Dates:</strong> Choose invoice date and due date</li>
                  <li><strong>Configure Pricing:</strong> Enter quantity, unit price, and service description</li>
                  <li><strong>Click "Apply Changes"</strong> to save all edits</li>
                  <li><strong>Click "Download PDF"</strong> to save and download your invoice</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-accent" />
                Manage Clients
              </CardTitle>
              <CardDescription>Clients Page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-foreground">Store and organize all your client information in one place for quick access when creating invoices.</p>
              <div className="bg-secondary/20 p-4 rounded border border-border space-y-3 text-xs text-muted-foreground">
                <p><strong>Key Features:</strong></p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Add Clients:</strong> Create records with name, address, country, and notes</li>
                  <li><strong>Quick Selection:</strong> Select clients from a dropdown when creating invoices</li>
                  <li><strong>Search & Filter:</strong> Find clients quickly using the search bar</li>
                  <li><strong>View Invoice History:</strong> See all invoices created for each client</li>
                  <li><strong>Auto-Extract Data:</strong> Upload invoices or spreadsheets to populate client data via AI</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5 text-secondary-foreground" />
                Customize Invoices
              </CardTitle>
              <CardDescription>Edit Form</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-foreground">Every invoice can be tailored to match your branding and specific business needs.</p>
              <div className="bg-secondary/20 p-4 rounded border border-border space-y-3 text-xs text-muted-foreground">
                <p><strong>What You Can Customize:</strong></p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Branding:</strong> Add your company logo by pasting a URL</li>
                  <li><strong>Company Info:</strong> Name, address, phone, and contact email</li>
                  <li><strong>Invoice Details:</strong> Number prefix and dates</li>
                  <li><strong>Pricing:</strong> Descriptions, quantities, unit prices, and line items</li>
                  <li><strong>Terms:</strong> Payment instructions and contact details</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-primary" />
                Bulk Generate
              </CardTitle>
              <CardDescription>Bulk Invoice Page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-foreground">Save time by creating invoices for multiple clients in one go.</p>
              <div className="bg-secondary/20 p-4 rounded border border-border space-y-3 text-xs text-muted-foreground">
                <p><strong>How It Works:</strong></p>
                <ol className="list-decimal list-inside space-y-2">
                  <li><strong>Choose Invoice Type:</strong> Custody or Connect Partner</li>
                  <li><strong>Select Clients:</strong> Check the clients you want to invoice</li>
                  <li><strong>Set Global Details:</strong> Dates and default pricing for all invoices</li>
                  <li><strong>Generate:</strong> Click "Generate PDFs" to create all invoices</li>
                  <li><strong>Download:</strong> All invoices are packaged into a single ZIP file</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-accent/20 bg-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-accent" />
              Pro Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-foreground">
            <p><strong>💡 Tip 1 – Build Your Client Database First:</strong> Spend a few minutes adding clients in the "Clients" tab to save time later.</p>
            <p><strong>💡 Tip 2 – Use "Generate New" for Speed:</strong> Click "Generate New" to instantly create a fresh invoice with today's date and automatic due dates.</p>
            <p><strong>💡 Tip 3 – Check the Live Preview:</strong> The invoice preview updates in real-time as you edit the form.</p>
            <p><strong>💡 Tip 4 – Your History is Automatically Saved:</strong> Every invoice you download is recorded in the invoice history under the "Clients" tab.</p>
            <p><strong>💡 Tip 5 – Reset Templates Easily:</strong> Click "Reset" in the edit form to return all fields to default values.</p>
            <p><strong>💡 Tip 6 – Bulk Generate for Scale:</strong> Create dozens of invoices in minutes using the "Bulk Generate" feature.</p>
            <p><strong>💡 Tip 7 – Logo URLs Must Be Accessible:</strong> Make sure your logo URL is public (HTTPS). The invoice will still print without it if it fails to load.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}