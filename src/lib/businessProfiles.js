import { months } from "./invoiceUtils";

const today = new Date();
const currentMonth = months[today.getMonth()];
const currentYear = today.getFullYear();

export const businessProfiles = {
  sfox: {
    id: "sfox",
    name: "sFOX",
    logoUrl: "https://media.base44.com/images/public/6a049f1fdb040b9d18c5bf50/f444be89d_images_squarespace-cdn_com_sFOX_Logo_RGB_Navy_de6c2b39.png",
    companyName: "sFOX Inc & affiliates",
    companyAddr1: "1712 Pioneer Avenue Suite 135",
    companyAddr2: "Cheyenne, WY 82001",
    companyPhone: "(424) 277-0535",
    contactEmail: "clientservices@sfox.com",
    invoiceTypes: [
      {
        id: "custody",
        label: "Custody Invoice",
        title: "Custody Invoice",
        prefix: "RD",
        singleLine: true,
        serviceDescription: "Custody Fee",
        quantity: 1,
        unitPrice: 500.00,
        paymentNotice: "Your sFOX account will be charged by the due date. Please ensure there are sufficient funds available to cover the charges.",
        defaultClient: {
          clientName: "Reflect 14 Foundation",
          clientAddr1: "613 KENDAL LN",
          clientAddr2: "LEAGUE CITY, TX 77573",
          clientCountry: "US",
        }
      },
      {
        id: "connect",
        label: "Connect Partner Invoice",
        title: "Connect Invoice",
        prefix: "ON",
        singleLine: false,
        lineItems: [
          { description: `${currentMonth} ${currentYear} Monthly Platform Fee`, quantity: 1, unitPrice: 10000.00 },
          { description: "sFOX SAFE Segregated Wallets", quantity: 1, unitPrice: 2500.00 },
          { description: "Same day ACH Fee", quantity: 1, unitPrice: 750.00 },
        ],
        paymentNotice: "Your sFOX account will be charged by the due date. Please ensure there are sufficient funds available to cover the charges. Note that if the account lacks the necessary balance for the outstanding amount, this will result in an automatic suspension of access to Connect services.",
        defaultClient: {
          clientName: "InvestiFi",
          clientAddr1: "8 The Green Suite 7529",
          clientAddr2: "Dover, DE 19901",
          clientCountry: "US",
        }
      }
    ]
  },
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