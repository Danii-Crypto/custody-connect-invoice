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
              Quick Start
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-foreground">
            <p>1. <strong>Add Clients:</strong> Go to "Clients" tab to create and manage client information</p>
            <p>2. <strong>Create Invoices:</strong> Use the "Custody Invoice" or "Connect Partner Invoice" tabs on the home page</p>
            <p>3. <strong>Download:</strong> Click "Download PDF" to save your invoice</p>
            <p>4. <strong>Bulk Generate:</strong> Use "Bulk Generate" to create multiple invoices at once</p>
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
            <CardContent className="space-y-3 text-sm">
              <p className="text-foreground"><strong>Custody Invoice:</strong> Single-line item invoices for service fees</p>
              <p className="text-foreground"><strong>Connect Partner Invoice:</strong> Multi-line invoices for detailed billing</p>
              <div className="bg-secondary/20 p-3 rounded border border-border space-y-2 text-xs text-muted-foreground">
                <p><strong>Steps:</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Click "Edit" to open the form</li>
                  <li>Select a client or enter details manually</li>
                  <li>Customize company info, dates, and amounts</li>
                  <li>Click "Apply Changes" to update preview</li>
                  <li>Click "Download PDF" to save</li>
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
            <CardContent className="space-y-3 text-sm">
              <p className="text-foreground">Store and organize all your client information in one place.</p>
              <div className="bg-secondary/20 p-3 rounded border border-border space-y-2 text-xs text-muted-foreground">
                <p><strong>You can:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Add new clients with name, address, country</li>
                  <li>Search and filter clients</li>
                  <li>View invoice history per client</li>
                  <li>Upload invoices to auto-extract client data</li>
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
            <CardContent className="space-y-3 text-sm">
              <p className="text-foreground">Each invoice is fully customizable with your branding.</p>
              <div className="bg-secondary/20 p-3 rounded border border-border space-y-2 text-xs text-muted-foreground">
                <p><strong>Customize:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Logo URL (company branding)</li>
                  <li>Invoice dates and numbers</li>
                  <li>Company & client details</li>
                  <li>Service descriptions and pricing</li>
                  <li>Payment terms and contact info</li>
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
            <CardContent className="space-y-3 text-sm">
              <p className="text-foreground">Create multiple invoices for different clients at once.</p>
              <div className="bg-secondary/20 p-3 rounded border border-border space-y-2 text-xs text-muted-foreground">
                <p><strong>Steps:</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Select invoice type (Custody or Connect)</li>
                  <li>Check clients you want to invoice</li>
                  <li>Set global invoice details</li>
                  <li>Click "Generate PDFs" to create all</li>
                  <li>Download as ZIP file</li>
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
          <CardContent className="space-y-3 text-sm text-foreground">
            <p><strong>💡 Tip 1:</strong> Add clients first in the "Clients" tab, then select them from dropdowns when creating invoices</p>
            <p><strong>💡 Tip 2:</strong> Use "Generate New" to quickly create invoices with today's date and automatic due dates</p>
            <p><strong>💡 Tip 3:</strong> The invoice preview updates in real-time as you edit—see changes instantly</p>
            <p><strong>💡 Tip 4:</strong> Downloaded PDFs are automatically saved to your invoice history for reference</p>
            <p><strong>💡 Tip 5:</strong> Use "Reset" in the edit form to revert to default template values</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}