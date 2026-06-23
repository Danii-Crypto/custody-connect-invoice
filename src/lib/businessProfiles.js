import { months } from "./invoiceUtils";

const today = new Date();
const currentMonth = months[today.getMonth()];
const currentYear = today.getFullYear();

export const businessProfiles = {
  alessa: {
    id: "alessa",
    name: "Alessa's Boat Clinic",
    logoUrl: "https://media.base44.com/images/public/6a049f1fdb040b9d18c5bf50/b400a6da5_AllessasBoatClinicNOBG.jpg",
    companyName: "ALESSA'S BOAT CLINIC FOUNDATION LIMITED",
    companyAddr1: "",
    companyAddr2: "Jamaica",
    companyPhone: "876-363-9741 | 876-838-3081 | 876-303-9855",
    contactEmail: "",
    bankDetails: {
      bank: "NCB",
      branch: "Port Antonio",
      accountName: "Alvin Shaw",
      accountType: "Savings",
      accountNumber: "844315201",
    },
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