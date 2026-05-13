import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Zap, Download, Settings, AlertCircle } from "lucide-react";

export default function HowToUse() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-3">How to Use Invoice Generator</h1>
          <p className="text-lg text-muted-foreground">A quick guide to getting started with creating professional invoices</p>
        </div>

        {/* Quick Start */}
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
            <p>2. <strong>Create Your First Invoice:</strong> Return to the home page. Choose between "Custody Invoice" (for single-line service fees) or "Connect Partner Invoice" (for detailed multi-line billing).</p>
            <p>3. <strong>Fill in the Details:</strong> Click the "Edit" button to open the form. Select or create a client, add your company info, set dates, and configure pricing. Your changes update the preview instantly.</p>
            <p>4. <strong>Download as PDF:</strong> Once you're happy with the invoice, click "Download PDF" to save it to your device. It's automatically added to your invoice history.</p>
            <p>5. <strong>Create More Invoices:</strong> Need to invoice multiple clients? Use "Bulk Generate" to create invoices for several clients at once.</p>
          </CardContent>
        </Card>

        {/* Main Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          
          {/* Feature 1: Home - Invoice Creation */}
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
                <p className="text-foreground mb-2"><strong>Custody Invoice:</strong> Perfect for straightforward service fees with a single line item. Use this when billing a flat rate or single service charge to a client.</p>
                <p className="text-foreground"><strong>Connect Partner Invoice:</strong> Ideal for detailed billing with multiple line items. Use this when you need to itemize different services, products, or charges separately.</p>
              </div>
              <div className="bg-secondary/20 p-4 rounded border border-border space-y-3 text-xs text-muted-foreground">
                <p><strong>How to Create an Invoice:</strong></p>
                <ol className="list-decimal list-inside space-y-2">
                  <li><strong>Click "Edit"</strong> to open the invoice form</li>
                  <li><strong>Select a Client</strong> from the dropdown at the top, or manually enter client details</li>
                  <li><strong>Upload a Logo</strong> (optional) by entering the image URL in the "Logo URL" field</li>
                  <li><strong>Set the Dates:</strong> Choose invoice date and due date using the date pickers</li>
                  <li><strong>Configure Pricing:</strong> Enter quantity, unit price, and service description</li>
                  <li><strong>Customize Details:</strong> Add your company address, phone, payment terms, and contact email</li>
                  <li><strong>Review the Preview:</strong> Your changes update instantly—check the invoice preview on the right</li>
                  <li><strong>Click "Apply Changes"</strong> to save all edits</li>
                  <li><strong>Click "Download PDF"</strong> to save and download your invoice</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Feature 2: Clients */}
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
                  <li><strong>Add Clients:</strong> Create new client records with name, address line 1, address line 2, country, and optional notes</li>
                  <li><strong>Quick Selection:</strong> When creating invoices, select clients from a dropdown instead of re-typing their information</li>
                  <li><strong>Search & Filter:</strong> Find clients quickly using the search bar</li>
                  <li><strong>View Invoice History:</strong> See all invoices created for each client in one place</li>
                  <li><strong>Auto-Extract Data:</strong> Upload invoices or spreadsheets to automatically extract and populate client data (powered by AI)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Feature 3: Customization */}
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
                  <li><strong>Branding:</strong> Add your company logo by pasting a URL to your logo image</li>
                  <li><strong>Company Info:</strong> Your company name, address, phone number, and contact email</li>
                  <li><strong>Invoice Details:</strong> Invoice number prefix, dates (invoice date and due date)</li>
                  <li><strong>Client Info:</strong> Client name and address (or select from saved clients)</li>
                  <li><strong>Pricing:</strong> Service descriptions, quantities, unit prices, and line items</li>
                  <li><strong>Terms:</strong> Payment instructions, payment notice, and contact details</li>
                  <li><strong>Real-Time Preview:</strong> See all changes instantly in the invoice preview below</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Feature 4: Bulk Generate */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-primary" />
                Bulk Generate
              </CardTitle>
              <CardDescription>Bulk Invoice Page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-foreground">Save time by creating invoices for multiple clients in one go instead of creating them individually.</p>
              <div className="bg-secondary/20 p-4 rounded border border-border space-y-3 text-xs text-muted-foreground">
                <p><strong>How It Works:</strong></p>
                <ol className="list-decimal list-inside space-y-2">
                  <li><strong>Choose Invoice Type:</strong> Select whether you're creating Custody or Connect Partner invoices</li>
                  <li><strong>Select Clients:</strong> Check the box next to each client you want to invoice</li>
                  <li><strong>Set Global Details:</strong> Enter company info, dates, and default pricing that applies to all invoices</li>
                  <li><strong>Customize Per Client (Optional):</strong> Override pricing or line items for specific clients if needed</li>
                  <li><strong>Generate:</strong> Click "Generate PDFs" and the app creates all invoices automatically</li>
                  <li><strong>Download:</strong> All invoices are packaged into a single ZIP file ready to download</li>
                </ol>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Pro Tips */}
        <Card className="border-accent/20 bg-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-accent" />
              Pro Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-foreground">
            <p><strong>💡 Tip 1 – Build Your Client Database First:</strong> Spend a few minutes adding clients in the "Clients" tab. This saves time later since you can quickly select clients from dropdowns instead of retyping their info every time.</p>
            <p><strong>💡 Tip 2 – Use "Generate New" for Speed:</strong> Click "Generate New" to instantly create a fresh invoice with today's date and automatic due dates (usually 7 days out). Faster than manual entry.</p>
            <p><strong>💡 Tip 3 – Check the Live Preview:</strong> The invoice preview on the right updates in real-time as you edit the form. This helps you catch formatting issues and spelling mistakes before downloading.</p>
            <p><strong>💡 Tip 4 – Your History is Automatically Saved:</strong> Every invoice you download is recorded in the invoice history. You can always find, review, or re-download past invoices from the "Clients" tab.</p>
            <p><strong>💡 Tip 5 – Reset Templates Easily:</strong> Made a mistake or want to start over? Click "Reset" in the edit form to return all fields to default template values.</p>
            <p><strong>💡 Tip 6 – Bulk Generate for Scale:</strong> If you invoice many clients regularly, the "Bulk Generate" feature is a huge time-saver—create dozens of invoices in minutes.</p>
            <p><strong>💡 Tip 7 – Logo URLs Must Be Accessible:</strong> When adding a logo, make sure the URL is public and accessible (HTTPS). If the image fails to load, the invoice will still print without it.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}