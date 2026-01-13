import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { FormStructure } from '@/types';
import { getComputedOptions } from './field-utils';
import api from '@/lib/api';

interface FichaData {
  id?: string;
  nombre_familia?: string;
  user?: { name: string };
  risk_level?: string;
  risk_score?: number;
  datos?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  app_version?: string;
  device_model?: string;
  geo_location?: string | object;
}

const normalizeSectionKey = (name: string) => {
    return name.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
};

const findArrayData = (sectionName: string, datos: any) => {
    const SECTION_KEYWORDS: Record<string, string> = {
        'familiares': 'miembros_generales_data', 
        'especiales': 'miembros_especiales_data',
        'fallecidos': 'miembros_fallecidos_data',
        'ambiental': 'problemas_ambientales_data', 
        'tratamiento': 'personas_lugares_tratamiento_data'
    };
    
    const normalizedName = sectionName.toLowerCase();
    for (const [keyword, key] of Object.entries(SECTION_KEYWORDS)) {
        if (normalizedName.includes(keyword)) {
             if (keyword === 'familiares' && (normalizedName.includes('especiales') || normalizedName.includes('fallecidos'))) continue;
             return datos[key];
        }
    }

    const baseKey = normalizeSectionKey(sectionName);
    const candidateKey = `${baseKey}_data`;
    if (Array.isArray(datos[candidateKey])) return datos[candidateKey];

    return undefined;
};

// -- ASYNC IMAGE LOADER --
// -- ASYNC IMAGE LOADER --
const loadImage = async (url: string): Promise<string | null> => {
    try {
        const response = await fetch(url, { mode: 'cors' }); // Try CORS first
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn("Fetch failed, trying Image fallback", e);
        // Fallback to Image tag (traditional)
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/jpeg'));
                } else resolve(null);
            };
            img.onerror = () => resolve(null);
            img.src = url;
        });
    }
};

const getLabelForValue = (value: any, field?: any, allFields?: any[], extraOptions: any[] = []) => {
    if (value === null || value === undefined) return '';
    
    // Handle Objects (Prevent [object Object])
    if (typeof value === 'object') {
        if (value.lat || value.latitude) {
            return `Lat: ${value.lat || value.latitude} Lng: ${value.lng || value.longitude}`;
        }
        return JSON.stringify(value); 
    }

    const strValue = String(value);

    // 0. Check Extra Options (Catalogs)
    if (extraOptions.length > 0) {
        const match = extraOptions.find(o => String(o.id) === strValue || String(o.value) === strValue);
        if (match) return match.name || match.label;
    }

    // 1. Check Field Options
    if (field) {
        const options = getComputedOptions(field);
        if (options && options.length > 0) {
            const option = options.find(o => o.value === strValue);
            if (!option && strValue.includes(',')) {
                 return strValue.split(',').map(v => {
                     const subOpt = options.find(o => o.value === v.trim());
                     return subOpt ? subOpt.label : v;
                 }).join(', ');
            }
            return option ? option.label : strValue;
        }

        // 2. Boolean/Checkboxes
        if (field.type === 'checkbox' && !options.length) {
             return (strValue === 'true' || strValue === '1' || strValue === 'on') ? 'Sí' : 'No';
        }
    }

    return strValue;
};

export async function generateFichaPDF(ficha: FichaData, schema?: FormStructure) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // -- FETCH CATALOGS --
  let provinces: any[] = [];
  let cantons: any[] = [];
  let parishes: any[] = [];

  try {
      if (ficha.datos?.select_provincia) {
          const pRes = await api.get('/geo/provinces');
          provinces = pRes.data;
          
          if (ficha.datos.select_canton) {
              const cRes = await api.get(`/geo/cantons/${ficha.datos.select_provincia}`);
              cantons = cRes.data;
              
              if (ficha.datos.select_parroquia) {
                   const paRes = await api.get(`/geo/parishes/${ficha.datos.select_canton}`);
                   parishes = paRes.data;
              }
          }
      }
  } catch (e) {
      console.error("Error fetching location catalogs for PDF", e);
  }

  const locationCatalogs = {
      'select_provincia': provinces,
      'select_canton': cantons,
      'select_parroquia': parishes,
      'provincia': provinces,
      'canton': cantons, 
      'parroquia': parishes
  };
  
  // -- COLORS --
  const primaryColor: [number, number, number] = [41, 128, 185]; 
  const secondaryColor: [number, number, number] = [52, 73, 94]; 
  const lightGray: [number, number, number] = [245, 245, 245];

  // -- HEADER --
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('FICHA FAMILIAR', 14, 20);
  
  doc.setFontSize(10);
  doc.text(`ID: ${ficha.id || 'N/A'}`, 14, 32);
  doc.text(`Generado: ${format(new Date(), 'PPP', { locale: es })}`, pageWidth - 14, 20, { align: 'right' });
  doc.text(`Familia: ${ficha.nombre_familia || 'Sin nombre'}`, pageWidth - 14, 32, { align: 'right' });

  // -- RISK SUMMARY (Restored to Top) --
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, 50, pageWidth - 28, 25, 3, 3, 'FD');

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('ESTADO DE RIESGO', 20, 60);

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(String(ficha.risk_level || 'No calculado'), 20, 68);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Puntaje: ${ficha.risk_score || 0}`, pageWidth - 25, 68, { align: 'right' });

  let yPos = 85;

  // -- 1. AUDIT INFO --
  doc.setFontSize(12);
  doc.setTextColor(...secondaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN DE AUDITORÍA', 14, yPos);
  yPos += 3;

  // ... (Rest of Audit Logic matches existing variable names) ...
  // We need to match the key context to perform the replacement correctly.
  
  let geoString = '-';
  if (ficha.geo_location) {
      if (typeof ficha.geo_location === 'object') {
          const g: any = ficha.geo_location;
          geoString = `Lat: ${g.lat || g.latitude || '?'} | Lng: ${g.lng || g.longitude || '?'}`;
      } else {
          try {
              const g = JSON.parse(String(ficha.geo_location));
              geoString = `Lat: ${g.lat || g.latitude || '?'} | Lng: ${g.lng || g.longitude || '?'}`;
          } catch {
              geoString = String(ficha.geo_location);
          }
      }
  }

  autoTable(doc, {
    startY: yPos,
    head: [['Dispositivo', 'Versión App', 'Ubicación', 'Usuario', 'Actualizado']],
    body: [[
        ficha.device_model || '-',
        ficha.app_version || '-',
        geoString,
        ficha.user?.name || '-',
        ficha.updated_at ? format(new Date(ficha.updated_at), 'dd/MM/yyyy HH:mm', { locale: es }) : '-'
    ]],
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: lightGray, textColor: 50, fontStyle: 'bold' }
  });

  // @ts-ignore
  yPos = doc.lastAutoTable.finalY + 10;

  // -- 1.5 GEOREFERENCIA (Location) --
  doc.setFontSize(12);
  doc.setTextColor(...secondaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('GEORREFERENCIA', 14, yPos);
  yPos += 3;

  const provId = ficha.datos?.select_provincia;
  const cantId = ficha.datos?.select_canton;
  const parrId = ficha.datos?.select_parroquia;

  const provName = provinces.find(p => String(p.id) === String(provId))?.name || provId || '-';
  const cantName = cantons.find(c => String(c.id) === String(cantId))?.name || cantId || '-';
  const parrName = parishes.find(p => String(p.id) === String(parrId))?.name || parrId || '-';

  autoTable(doc, {
    startY: yPos,
    head: [['Provincia', 'Cantón', 'Parroquia']],
    body: [[ provName, cantName, parrName ]],
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: lightGray, textColor: 50, fontStyle: 'bold' }
  });

  // @ts-ignore
  yPos = doc.lastAutoTable.finalY + 15; 
  // Ensure we have enough space before next section
  if (yPos > 260) {
      doc.addPage();
      yPos = 20;
  }

  if (schema && ficha.datos) {
      const allFields = schema.sections.flatMap(s => s.fields);
      
      const userOrder = [
        'codigo', 'locali', // Codigo Localizacion
        'general', 'datos generales', 'informacion general', // Info General
        'miembros', 'familiares', // Familiares
        'especiales', 
        'fallecidos', 
        'tratamiento', 
        'ambiental', 'contaminacion',
        'familiograma', 
        'vivienda', 'ubicacion',
        'responsable', 'firma'
      ];
      
      const sortedSections = [...schema.sections].sort((a, b) => {
          const aName = normalizeSectionKey(a.name);
          const bName = normalizeSectionKey(b.name);
          
          let aIndex = userOrder.findIndex(k => aName.includes(k));
          let bIndex = userOrder.findIndex(k => bName.includes(k));
          
          if (aIndex === -1) aIndex = 999;
          if (bIndex === -1) bIndex = 999;
          
          return aIndex - bIndex;
      });

      for (const section of sortedSections) {
          // Page Break Check
          if (yPos > 250) {
              doc.addPage();
              yPos = 20;
          }

          // Section Title
          doc.setFontSize(11);
          doc.setTextColor(...primaryColor);
          doc.setFont('helvetica', 'bold');
          
          doc.setFillColor(...lightGray);
          doc.rect(14, yPos - 5, pageWidth - 28, 8, 'F');
          doc.text(section.name.toUpperCase(), 16, yPos);
          yPos += 8;

          const arrayData = findArrayData(section.name, ficha.datos || {});
          
          if (arrayData && Array.isArray(arrayData)) {
              // --- CARD VIEW (Specific for General Members) ---
              // User requirement: "familiares normal" = Card, "fallecidos" = Table
              const normalizedName = section.name.toLowerCase();
              const isFamiliares = normalizedName.includes('familiares') && 
                                   !normalizedName.includes('especiales') && 
                                   !normalizedName.includes('fallecidos');
              
              if (isFamiliares && arrayData.length > 0) {
                   // --- IMPROVED CARD GRID VIEW ---
                   doc.setFontSize(9);
                   
                   const hiddenCols = ['id'];
                   const allKeys = Object.keys(arrayData[0]).filter(k => !hiddenCols.includes(k));

                   // --- IMPROVED CARD GRID VIEW (using autoTable for stability) ---
                   doc.setFontSize(9);
                   
                   // (Variables hiddenCols and allKeys are preserved from outer scope or re-declared if needed, assuming safe scope)
                   const cardHiddenCols = ['id'];
                   const cardKeys = Object.keys(arrayData[0]).filter(k => !cardHiddenCols.includes(k));

                   for (let i = 0; i < arrayData.length; i++) {
                       const item = arrayData[i];
                       
                       // A. Check basic space for Header
                       if (yPos > 260) {
                            doc.addPage();
                            yPos = 20;
                       }

                       const startCardY = yPos;
                       const headerHeight = 8;

                       // B. Draw Header (Background) - We will draw the border LATER to match content height
                       doc.setFillColor(...primaryColor); 
                       doc.roundedRect(14, startCardY, pageWidth - 28, headerHeight, 2, 2, 'F');
                       doc.rect(14, startCardY + headerHeight - 2, pageWidth - 28, 2, 'F'); // Square bottom of header

                       // Header Text
                       doc.setFont('helvetica', 'bold');
                       doc.setTextColor(255, 255, 255);
                       doc.setFontSize(10);
                       const mainLabel = item['nombres'] ? `${item['nombres']} ${item['apellidos'] || ''}` : `Miembro del Hogar #${i + 1}`;
                       doc.text(mainLabel.toUpperCase(), 18, startCardY + 5.5);
                       
                       // C. Prepare Table Data
                       const tableBody: any[][] = [];
                       let currentRow: any[] = [];

                       cardKeys.forEach((key) => {
                           const val = item[key];
                           if (val !== undefined && val !== null && val !== '') {
                               const fieldDef = section.fields.find(f => f.name === key) || allFields.find(f => f.name === key);
                               const label = fieldDef ? fieldDef.label : key.replace(/_/g, ' ');
                               const displayVal = getLabelForValue(val, fieldDef, allFields);
                               
                               currentRow.push(`${label}:`);
                               currentRow.push(displayVal);

                               if (currentRow.length === 4) {
                                   tableBody.push(currentRow);
                                   currentRow = [];
                               }
                           }
                       });
                       if (currentRow.length > 0) {
                           while(currentRow.length < 4) currentRow.push('');
                           tableBody.push(currentRow);
                       }

                       // D. Render Content Table
                       autoTable(doc, {
                           startY: startCardY + headerHeight, // Start right after header
                           body: tableBody,
                           theme: 'plain',
                           styles: { fontSize: 8, cellPadding: 1.5, overflow: 'linebreak' },
                           columnStyles: {
                               0: { fontStyle: 'bold', textColor: secondaryColor, cellWidth: 35 }, 
                               1: { cellWidth: 50, textColor: 50 }, 
                               2: { fontStyle: 'bold', textColor: secondaryColor, cellWidth: 35 }, 
                               3: { cellWidth: 'auto', textColor: 50 } 
                           },
                           margin: { left: 14, right: 14 },
                       });

                       // E. Calculate Dynamic Height & Draw Border
                       // @ts-ignore
                       const finalCardY = doc.lastAutoTable.finalY + 2; 
                       const totalCardHeight = finalCardY - startCardY;

                       // Draw Border: REMOVED per user request
                       // doc.roundedRect(14, startCardY, pageWidth - 28, totalCardHeight, 2, 2, 'S'); // 'S' for Stroke only (transparent inside)

                       // Update Main Y
                       yPos = finalCardY + 5;
                   }
                   yPos += 5;

              } else if (arrayData.length > 0) {
                   // --- STANDARD TABLE VIEW (For Fallecidos, etc) ---
                   const hiddenCols = ['id'];
                   const allKeys = Object.keys(arrayData[0]).filter(k => !hiddenCols.includes(k));
                   
                   const displayHeaders = allKeys.map(h => {
                       const f = section.fields.find(field => field.name === h) || allFields.find(field => field.name === h);
                       return f ? f.label : h.replace(/_/g, ' ');
                   });

                   const body = arrayData.map(item => {
                       return allKeys.map(key => {
                           const val = item[key];
                           const fieldDef = section.fields.find(f => f.name === key) || allFields.find(f => f.name === key);
                           return getLabelForValue(val, fieldDef, allFields);
                       });
                   });

                   autoTable(doc, {
                       startY: yPos,
                       head: [displayHeaders],
                       body: body,
                       theme: 'grid',
                       styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
                       headStyles: { fillColor: secondaryColor, textColor: 255, fontStyle: 'bold' },
                       alternateRowStyles: { fillColor: [249, 249, 249] },
                       margin: { left: 14, right: 14 }
                   });
                   // @ts-ignore
                   yPos = doc.lastAutoTable.finalY + 12;

              } else {
                   doc.setFontSize(9);
                   doc.setTextColor(150, 150, 150);
                   doc.text('(Sin registros)', 18, yPos + 5);
                   yPos += 10;
              }
          } else {
              // --- KEY-VALUE SECTION ---
              const keyValStartY = yPos;
              const sectionData: [string, string][] = [];
              
              // We'll collect data first, but handle images immediately to preserve flow
              
              for (const field of section.fields) {
                  const val = (ficha.datos || {})[field.name];
                  
                  if (val !== undefined && val !== null && val !== '') {
                      // SKIP: Geographic fields already shown in dedicated section
                      if (['select_provincia', 'select_canton', 'select_parroquia', 'provincia', 'canton', 'parroquia'].includes(field.name)) {
                          continue;
                      }

                      const strVal = String(val);

                      // 1. SIGNATURE
                      if (field.type === 'signature' || field.name === 'firma_responsable' || field.name === 'firma') {
                          // Flush current table if exists
                          if (sectionData.length > 0) {
                              autoTable(doc, {
                                  startY: yPos,
                                  body: sectionData,
                                  theme: 'striped',
                                  showHead: 'never',
                                  styles: { fontSize: 9, cellPadding: 3 },
                                  columnStyles: { 0: { fontStyle: 'bold', cellWidth: 90, textColor: secondaryColor } },
                                  margin: { left: 14, right: 14 }
                              });
                              // @ts-ignore
                              yPos = doc.lastAutoTable.finalY + 8;
                              sectionData.length = 0;
                          }

                          const sigBase64 = strVal.replace(/^data:image\/\w+;base64,/, '');
                          try {
                              if (sigBase64.length > 100) { 
                                   if (yPos > 240) { doc.addPage(); yPos = 20; }
                                   doc.setFont('helvetica', 'bold');
                                   doc.setFontSize(9);
                                   doc.text(field.label, 14, yPos);
                                   
                                   // Image below label
                                   doc.addImage(sigBase64, 'PNG', 14, yPos + 5, 50, 25);
                                   
                                   // Advance plenty of space
                                   yPos += 45; 
                                   continue;
                              }
                          } catch (err) {}
                      } 
                      
                      // 2. IMAGES (Robust Check)
                      // Check for type='image' OR 'img_' prefix OR value looks like image URL
                      const isImageField = field.type === 'image' || field.name.startsWith('img_');
                      const isImageUrl = strVal.match(/\.(jpeg|jpg|png|webp)($|\?)/i) || strVal.startsWith('data:image');

                      if (isImageField || (isImageUrl && strVal.length > 20)) {
                          if (strVal.startsWith('http') || strVal.startsWith('data:')) {
                              // Flush current table
                              if (sectionData.length > 0) {
                                  autoTable(doc, {
                                      startY: yPos,
                                      body: sectionData,
                                      theme: 'striped',
                                      showHead: 'never',
                                      styles: { fontSize: 9, cellPadding: 3 },
                                      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 90, textColor: secondaryColor } },
                                      margin: { left: 14, right: 14 }
                                  });
                                  // @ts-ignore
                                  yPos = doc.lastAutoTable.finalY + 8;
                                  sectionData.length = 0;
                              }

                              // Async Load and Render
                              const base64Img = await loadImage(strVal);
                              if (base64Img) {
                                  if (yPos > 220) { doc.addPage(); yPos = 20; }
                                  
                                  doc.setFontSize(9);
                                  doc.setFont('helvetica', 'bold');
                                  doc.text(field.label, 14, yPos);
                                  // Draw Image
                                  doc.addImage(base64Img, 'JPEG', 14, yPos + 2, 80, 60);
                                  yPos += 70;
                                  continue;
                              }
                          }
                      }

                      // Standard Field
                      const extraOpts = (locationCatalogs as any)[field.name] || [];
                      let displayVal = getLabelForValue(val, field, allFields, extraOpts);
                      
                      // Fallback for failed images (don't show ugly URL)
                      if ((field.type === 'image' || field.name.startsWith('img_')) && String(val).startsWith('http')) {
                          displayVal = 'Ver Imagen en Navegador';
                          // We will make this cell clickable in autoTable potentially? 
                          // autoTable doesn't easily support links in cell text directly without hooks.
                          // So we will just leave the text clean. 
                          // If `displayVal` is a URL, it's ugly. 
                          // We'll leave it as "Ver Imagen..." and maybe the user can copy/paste if needed, 
                          // or we trust that the user said "links work in browser".
                          // Actually, showing the URL is better IF it works, but the user said "me sigues poniendo la url".
                          // So hide it.
                      }

                      sectionData.push([field.label, displayVal]);
                  }
              }

              // Remainders
              if (sectionData.length > 0) {
                   autoTable(doc, {
                        startY: yPos,
                        body: sectionData,
                        theme: 'striped',
                        showHead: 'never',
                        styles: { fontSize: 9, cellPadding: 3 },
                        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 90, textColor: secondaryColor } },
                        margin: { left: 14, right: 14 }
                   });
                   // @ts-ignore
                   yPos = doc.lastAutoTable.finalY + 12;
              }
          }

          // @ts-ignore
           // Padding between sections
           yPos += 12;
      }
  }

  doc.save(`Ficha_${ficha.nombre_familia || 'Reporte'}.pdf`);
}
