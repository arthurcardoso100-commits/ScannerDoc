import * as XLSX from 'xlsx';
import type { ExcelData } from '../types';

export const parseExcelAndFindEmployee = async (file: File, employeeCode: string): Promise<ExcelData | null> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

                // Assuming Column C (index 2) is Employee Code
                // Adjust indices based on actual Excel structure. 
                // Let's assume:
                // Col A: Name (Index 0)
                // Col B: CPF (Index 1)
                // Col C: Code (Index 2)
                // Col D: Cargo (Index 3)

                // Find row with matching code
                const row = jsonData.find((r) => r[2] && String(r[2]).trim().toUpperCase() === employeeCode.trim().toUpperCase());

                if (row) {
                    const excelData: ExcelData = {
                        nome: row[0],
                        cpf: row[1],
                        cargo: row[3],
                    };
                    resolve(excelData);
                } else {
                    resolve(null);
                }
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
    });
};
