"use client";

import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

interface TextField {
  id: string;
  x: number;
  y: number;
  content: string;
  linkedColumn: string;
  fontSize: number;
  color: string;
}

interface ExcelData {
  headers: string[];
  rows: Record<string, string>[];
}

export default function InvoiceGenerator() {
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templatePreview, setTemplatePreview] = useState<string | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [textFields, setTextFields] = useState<TextField[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [previewRowIndex, setPreviewRowIndex] = useState<number>(0);
  const [generatedCount, setGeneratedCount] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  /** ================= UPLOAD TEMPLATE ================= */
  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTemplateFile(file);
    if (file.type === "application/pdf") {
      setTemplatePreview(URL.createObjectURL(file));
    } else {
      const reader = new FileReader();
      reader.onload = (event) => setTemplatePreview(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  /** ================= UPLOAD EXCEL ================= */
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFile(file);
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
    const headers = json.length > 0 ? Object.keys(json[0]) : [];
    setExcelData({ headers, rows: json });
    setPreviewRowIndex(0);
  };

  /** ================= TEXT FIELDS ================= */
  const addTextField = () => {
    if (!templateRef.current) return;
    const rect = templateRef.current.getBoundingClientRect();
    const newField: TextField = {
      id: Date.now().toString(),
      x: rect.width / 2 - 50,
      y: rect.height / 2 - 10,
      content: "New Field",
      linkedColumn: "",
      fontSize: 14,
      color: "#000000",
    };
    setTextFields([...textFields, newField]);
    setSelectedField(newField.id);
  };

  const updateTextField = (id: string, updates: Partial<TextField>) => {
    setTextFields(textFields.map(f => (f.id === id ? { ...f, ...updates } : f)));
  };

  const deleteTextField = (id: string) => {
    setTextFields(textFields.filter(f => f.id !== id));
    if (selectedField === id) setSelectedField(null);
  };

  /** ================= DRAG ================= */
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedField(id);
    if (!templateRef.current) return;

    const field = textFields.find(f => f.id === id);
    if (!field) return;

    const rect = templateRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left - field.x, y: e.clientY - rect.top - field.y };
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !selectedField || !templateRef.current) return;
    const rect = templateRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.current.x;
    const y = e.clientY - rect.top - dragOffset.current.y;
    updateTextField(selectedField, { x, y });
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  /** ================= GENERATE PDF ================= */
  const generateInvoices = async () => {
    if (!excelData || !templateFile) return;

    try {
      const row = excelData.rows[previewRowIndex];
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      if (templateFile.type.startsWith("image/")) {
        const imageBytes = await templateFile.arrayBuffer();
        const img = await pdfDoc.embedJpg(imageBytes).catch(() => pdfDoc.embedPng(imageBytes));
        page.drawImage(img, { x: 0, y: 0, width: 595, height: 842 });
      }

      textFields.forEach(f => {
        const text = f.linkedColumn ? row[f.linkedColumn] || "" : f.content;
        page.drawText(text, {
          x: f.x,
          y: 842 - f.y - f.fontSize,
          size: f.fontSize,
          font,
          color: rgb(parseInt(f.color.slice(1, 3), 16) / 255,
                     parseInt(f.color.slice(3, 5), 16) / 255,
                     parseInt(f.color.slice(5, 7), 16) / 255),
        });
      });

      const arrayBuffer = await templateFile.arrayBuffer();
const blob = new Blob([new Uint8Array(arrayBuffer)], { type: templateFile.type });
const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${previewRowIndex + 1}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setGeneratedCount(1);
      setTimeout(() => setGeneratedCount(null), 3000);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const resetAll = () => {
    setTemplateFile(null);
    setTemplatePreview(null);
    setExcelFile(null);
    setExcelData(null);
    setTextFields([]);
    setSelectedField(null);
    setPreviewRowIndex(0);
  };

  const selectedFieldData = textFields.find(f => f.id === selectedField);

  return (
    <div className="invoice-app">
      <header>
        <h1>Générateur de Factures</h1>
        <button className="reset-btn" onClick={resetAll}>Tout Réinitialiser</button>
      </header>

      <main>
        <section className="controls-section">
          <div className="file-upload">
            <label>Modèle
              <input type="file" accept="image/*,.pdf" onChange={handleTemplateUpload} />
            </label>
            <label>Données Excel
              <input type="file" accept=".csv,.xlsx,.xls" onChange={handleExcelUpload} />
            </label>
          </div>

          <div className="textfields-section">
            <button onClick={addTextField}>Ajouter un Champ</button>
            {textFields.map(f => (
              <div key={f.id} className={`textfield-item ${selectedField === f.id ? 'selected' : ''}`} onClick={() => setSelectedField(f.id)}>
                <span>{f.content}</span>
                <button onClick={(e) => { e.stopPropagation(); deleteTextField(f.id); }}>✕</button>
              </div>
            ))}
            {selectedFieldData && (
              <div className="properties">
                <label>Contenu
                  <input value={selectedFieldData.content} onChange={(e) => updateTextField(selectedFieldData.id, { content: e.target.value })} />
                </label>
                <label>Colonne Liée
                  <select value={selectedFieldData.linkedColumn} onChange={(e) => updateTextField(selectedFieldData.id, { linkedColumn: e.target.value })}>
                    <option value="">Aucune</option>
                    {excelData?.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </label>
                <label>Taille
                  <input type="number" value={selectedFieldData.fontSize} onChange={(e) => updateTextField(selectedFieldData.id, { fontSize: parseInt(e.target.value) || 14 })} />
                </label>
                <label>Couleur
                  <input type="color" value={selectedFieldData.color} onChange={(e) => updateTextField(selectedFieldData.id, { color: e.target.value })} />
                </label>
              </div>
            )}
          </div>
        </section>

        <section className="preview-section">
          <div className="preview-template" ref={templateRef}>
            {templatePreview ? (
              <img src={templatePreview} alt="Modèle" className="template-image" />
            ) : <div className="empty-preview">Aucun modèle</div>}
            {textFields.map(f => {
              const content = f.linkedColumn ? excelData?.rows[previewRowIndex]?.[f.linkedColumn] || "" : f.content;
              return <div key={f.id} className={`text-field ${selectedField === f.id ? 'selected' : ''}`} style={{ left: f.x, top: f.y, fontSize: f.fontSize, color: f.color }} onMouseDown={(e) => handleMouseDown(e,f.id)}>{content}</div>;
            })}
          </div>

          <div className="navigation">
            <button onClick={() => setPreviewRowIndex(prev => Math.max(prev - 1, 0))} disabled={previewRowIndex <= 0}>Précédent</button>
            <button onClick={() => setPreviewRowIndex(prev => Math.min(prev + 1, excelData!.rows.length - 1))} disabled={previewRowIndex >= excelData!.rows.length - 1}>Suivant</button>
            <span>Ligne {previewRowIndex + 1} / {excelData?.rows.length || 0}</span>
          </div>

          <button className="generate-btn" onClick={generateInvoices} disabled={!templateFile || !excelFile || textFields.length === 0}>Générer PDF</button>
        </section>
      </main>

      {generatedCount !== null && <div className="toast">Facture générée avec succès !</div>}
    </div>
  );
}
