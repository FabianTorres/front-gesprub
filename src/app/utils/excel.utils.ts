// src/app/utils/excel.utils.ts

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { MessageService } from 'primeng/api';

/**
 * Lee un archivo Excel y devuelve una promesa con los datos como un array de objetos.
 * Realiza validaciones de encabezados y de datos básicos.
 */
export function leerYValidarExcel(file: File, messageService: MessageService): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const bstr: ArrayBuffer = e.target.result;
        const workbook: XLSX.WorkBook = XLSX.read(bstr, { type: 'array' });
        const worksheetName: string = workbook.SheetNames[0];
        const worksheet: XLSX.WorkSheet = workbook.Sheets[worksheetName];

        // Validar encabezados
        const datosParaEncabezados = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false });
        if (!datosParaEncabezados || datosParaEncabezados.length < 1) {
          messageService.add({ severity: 'error', summary: 'Archivo vacío', detail: 'El archivo no contiene datos.' });
          return reject('Archivo vacío');
        }
        const encabezadosReales = (datosParaEncabezados[0] as string[]).map(h => String(h).trim());
        const encabezadosEsperados = ['Nombre del Caso', 'Descripción', 'Versión', 'Estado Modificación', 'Fuentes', 'Precondiciones', 'Pasos', 'Resultado Esperado'];
        
        if (!encabezadosEsperados.every(h => encabezadosReales.includes(h))) {
            messageService.add({ severity: 'error', summary: 'Plantilla incorrecta', detail: 'El archivo no tiene los encabezados esperados.', sticky: true });
            return reject('Encabezados incorrectos');
        }

        // Leer datos como texto plano
        const casosLeidos = XLSX.utils.sheet_to_json(worksheet, { raw: false, blankrows: false });

        // Validar contenido
        const errores: string[] = [];
        const camposObligatorios = ['Nombre del Caso', 'Descripción', 'Versión', 'Estado Modificación'];
        casosLeidos.forEach((fila: any, index: number) => {
          const numeroFila = index + 2;
          for (const campo of camposObligatorios) {
            if (!fila[campo] || String(fila[campo]).trim() === '') {
              errores.push(`Fila ${numeroFila}: El campo obligatorio "${campo}" está vacío.`);
            }
          }
          if (fila['Versión'] && !/^\d+([,.]\d+)?$/.test(String(fila['Versión']))) {
            errores.push(`Fila ${numeroFila}: El formato de la "Versión" es incorrecto (ej: 1.0 o 1,0).`);
          }
        });

        if (errores.length > 0) {
          messageService.add({ severity: 'error', summary: `Se encontraron ${errores.length} errores`, detail: 'Por favor, corrige los siguientes puntos:', sticky: true });
          errores.slice(0, 5).forEach(error => {
            messageService.add({ severity: 'warn', summary: error, sticky: true, life: 10000 });
          });
          return reject('Errores de validación');
        }
        
        resolve(casosLeidos);

      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Genera y descarga una plantilla de Excel para la importación de casos.
 */
export function descargarPlantillaCasos(): void {
  const encabezados = ['Nombre del Caso', 'Descripción', 'Versión', 'Estado Modificación', 'Fuentes', 'Precondiciones', 'Pasos', 'Resultado Esperado'];
  const filaEjemplo = ['Ej: Caso de Prueba 1', 'Ej: Descripción detallada.', '1.0', 'Nuevo', '1928; 1929', 'Ej: El usuario debe estar logueado.', 'Ej: 1. Hacer clic en X.', 'Ej: Se muestra un mensaje de éxito.'];
  
  const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([encabezados, filaEjemplo]);
  worksheet['!cols'] = [{ wch: 30 }, { wch: 50 }, { wch: 10 }, { wch: 20 }, { wch: 30 }, { wch: 40 }, { wch: 50 }, { wch: 40 }];
  
  const workbook: XLSX.WorkBook = { Sheets: { 'Plantilla': worksheet }, SheetNames: ['Plantilla'] };
  const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
  guardarArchivo(excelBuffer, "Plantilla_Importacion_Casos.xlsx");
}

/**
 * Genera y descarga un archivo Excel a partir de un array de datos.
 */
export function exportarAExcel(datos: any[], nombreArchivo: string): void {
  const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datos);
  const workbook: XLSX.WorkBook = { Sheets: { 'Datos': worksheet }, SheetNames: ['Datos'] };
  const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
  guardarArchivo(excelBuffer, `${nombreArchivo}_${new Date().getTime()}.xlsx`);
}

// Función auxiliar privada
function guardarArchivo(buffer: any, nombreArchivo: string): void {
  const data: Blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
  saveAs(data, nombreArchivo);
}