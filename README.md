# Numeris - Invoice Generator

[![React](https://img.shields.io/badge/React-18.x-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.x-blue)](https://www.typescriptlang.org/)
[![PDF Generation](https://img.shields.io/badge/PDF-Generation-red)](https://pdf-lib.js.org/)

Numeris is a **powerful web-based invoice generator** that allows users to create **customized invoices** by combining Excel data with PDF or image templates.

---

## Features

- 📊 **Excel Data Integration**: Upload Excel/CSV files to populate invoice data.
- 🎨 **Template Support**: Use PDF or image files as invoice templates.
- ✏️ **Custom Text Fields**: Add customizable text fields with drag-and-drop positioning.
- 🔗 **Data Linking**: Connect text fields to specific Excel columns for automatic population.
- 👀 **Live Preview**: Preview how invoices will look with actual data.
- 🎨 **Style Customization**: Adjust font size and color for each text field.
- 📥 **PDF Export**: Generate and download professional PDF invoices.

---

## How to Use

1. **Upload Template**: Select a PDF or image file to use as your invoice background.
2. **Upload Data**: Provide an Excel file containing your invoice data (customer information, amounts, etc.).
3. **Add Text Fields**: Create text fields and position them on your template.
4. **Link Data**: Connect each text field to the appropriate Excel column.
5. **Preview**: Navigate through your data to see how each invoice will look.
6. **Generate**: Export the invoice as a PDF document.

---

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **PDF Processing**: [pdf-lib](https://pdf-lib.js.org/)
- **Excel Processing**: [xlsx](https://github.com/SheetJS/sheetjs)
- **Styling**: CSS (easily customizable)

---

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/HAMMOUDAmustaphaahmed/Numeris.git
cd Numeris
npm install
npm run dev
http://localhost:3000

