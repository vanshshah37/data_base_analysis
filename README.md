# CRM Portal with Dynamic Invoice & Proforma Invoice (PI) Generator

A modern Next.js CRM portal equipped with database-backed customer management, automated sequential document numbering, and Windows Excel COM automation for pixel-perfect PDF/Excel sheet generation.

## 🚀 Key Features

* **CRM Customer Management**: Log, update, search, and manage customer contacts, addresses, internal notes, GSTINs, and state codes in a fast SQLite database.
* **Smart Invoicing & PI System**: Create invoices or proforma invoices with responsive form interfaces. Toggle modes instantly to autofetch the correct sequential number.
* **Windows Excel COM Automation**: High-fidelity generation engine using native Excel COM APIs via PowerShell. Directly populates Excel layouts (`.xlsx` or `.xlsm`), calculates complex grid formulas, and exports clean PDF copies.
* **SheetJS Preview**: Responsive Excel sheet preview grid displayed right in the browser before final print and download.
* **Privacy-First Design**: Sensitive customer database files (`dev.db`), generated PDF/Excel sheets (`invoices/`, `pi/`), and layouts (`public/templates/`) are ignored by default and kept local to your machine.

---

## 🛠️ Tech Stack

* **Framework**: [Next.js 16 (App Router with Turbopack)](https://nextjs.org/)
* **Database**: [Prisma ORM](https://www.prisma.io/) with [SQLite](https://www.sqlite.org/)
* **Automation**: Windows PowerShell + Microsoft Excel COM Interop
* **Styling**: Tailwind CSS & Shadcn UI
* **Spreadsheet Utility**: [SheetJS (XLSX)](https://sheetjs.com/)

---

## 📋 Prerequisites

To run the Excel generation script locally, you need:
1. **Windows OS**
2. **Microsoft Excel installed** (required for the COM API scripting)
3. **Node.js (v18+)**

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Migration
Initialize the SQLite database schema using Prisma:
```bash
npx prisma db push
```

### 3. Add Custom Excel Templates
Since templates contain sensitive company data, they are excluded from Git. To use the generator:
1. Create a `templates/` folder inside the `public/` directory:
   ```bash
   mkdir -p public/templates
   ```
2. Place your templates in that folder:
   * **Invoice Template**: Name it `invoice_template.xlsx`
   * **Proforma Invoice (PI) Template**: Name it `pi_template.xlsm`
3. Alternatively, upload templates directly from the web interface in the Invoices menu.

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the portal.
