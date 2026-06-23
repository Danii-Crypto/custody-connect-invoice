import { months } from "./invoiceUtils";

const today = new Date();
const currentMonth = months[today.getMonth()];
const currentYear = today.getFullYear();

export const businessProfiles = {
  alessa: {
    id: "alessa",
    name: "Alessa's Boat Clinic",
    logoUrl: "https://media.base44.com/images/public/6a049f1fdb040b9d18c5bf50/62006a35d_AllessasBoatClinic-BG.jpg",
    companyName: "ALESSA'S BOAT CLINIC FOUNDATION LIMITED",
    companyAddr1: "LOWER BRYAN'S BAY",
    companyAddr2: "NORWICH DISTRICT, PORTLAND",
    companyPhone: "876-363-9741 | 876-838-3081 | 876-303-9855",
    contactEmail: "",
    bankDetails: {
      bank: "NCB",
      branch: "Port Antonio",
      accountName: "Alvin Shaw",
      accountType: "Savings",
      accountNumber: "844315201",
    },
    serviceTemplates: [
      {
        id: "hull-maintenance",
        name: "Hull Maintenance & Repair",
        lineItems: [
          { description: "Hull inspection and assessment", quantity: 1, unitPrice: 0 },
          { description: "Hull cleaning and surface preparation", quantity: 1, unitPrice: 0 },
          { description: "Fiberglass repair and patching", quantity: 1, unitPrice: 0 },
          { description: "Anti-fouling bottom paint application", quantity: 1, unitPrice: 0 },
        ]
      },
      {
        id: "engine-service",
        name: "Engine Service & Diagnostics",
        lineItems: [
          { description: "Engine diagnostic scan", quantity: 1, unitPrice: 0 },
          { description: "Oil change and filter replacement", quantity: 1, unitPrice: 0 },
          { description: "Coolant system flush and refill", quantity: 1, unitPrice: 0 },
          { description: "Propeller and shaft inspection", quantity: 1, unitPrice: 0 },
        ]
      },
      {
        id: "general-inspection",
        name: "General Vessel Inspection",
        lineItems: [
          { description: "Full vessel safety inspection", quantity: 1, unitPrice: 0 },
          { description: "Safety equipment check", quantity: 1, unitPrice: 0 },
          { description: "Electrical system diagnostic", quantity: 1, unitPrice: 0 },
          { description: "Detailed inspection report", quantity: 1, unitPrice: 0 },
        ]
      },
      {
        id: "anti-fouling",
        name: "Anti-Fouling Treatment",
        lineItems: [
          { description: "Haul-out and blocking", quantity: 1, unitPrice: 0 },
          { description: "Hull pressure wash", quantity: 1, unitPrice: 0 },
          { description: "Sanding and surface preparation", quantity: 1, unitPrice: 0 },
          { description: "Anti-fouling paint application (2 coats)", quantity: 1, unitPrice: 0 },
        ]
      },
      {
        id: "custom",
        name: "Custom Service (Start Blank)",
        lineItems: [
          { description: "", quantity: 1, unitPrice: 0 },
        ]
      },
    ],
    invoiceTypes: [
      {
        id: "boatclinic",
        label: "Boat Clinic Invoice",
        title: "Boat Clinic Invoice",
        prefix: "BC",
        singleLine: false,
        lineItems: [
          { description: "", quantity: 1, unitPrice: 0 },
        ],
        paymentNotice: "Thank you for supporting Alessa's Boat Clinic Foundation Limited.\n\nPayment is strictly due within seven days of the invoice date. Please be advised that work will not begin under any circumstances until a 50% down payment of the grand total has been received and confirmed.\n\nFailure to make the required down payment may result in delays to the start of work and the scheduling of services.",
        defaultClient: {
          clientName: "",
          clientAddr1: "",
          clientAddr2: "",
          clientCountry: "JM",
        }
      }
    ]
  }
};