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

                // User provided mapping:
                // Col C (Index 2): Search Code
                // Col K (Index 10): Name
                // Col N (Index 13): CPF
                // Col M (Index 12): Cargo

                // Find row with matching code (Column C / Index 2)
                const row = jsonData.find((r) => r[2] && String(r[2]).trim().toUpperCase() === employeeCode.trim().toUpperCase());

                if (row) {
                    const excelData: ExcelData = {
                        nome: row[10], // Column K
                        cpf: row[13],  // Column N
                        cargo: row[12], // Column M
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

export const findEmployeeByCPF = async (file: File, targetCpf: string): Promise<ExcelData | null> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

                // Normalize target CPF (remove non-digits)
                const cleanTarget = targetCpf.replace(/\D/g, "");

                // Find row with matching CPF (Column N / Index 13)
                const row = jsonData.find((r) => {
                    if (!r[13]) return false;
                    const cellCpf = String(r[13]).replace(/\D/g, "");
                    return cellCpf === cleanTarget;
                });

                if (row) {
                    const excelData: ExcelData = {
                        nome: row[10], // Column K
                        cpf: row[13],  // Column N
                        cargo: row[12], // Column M
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
