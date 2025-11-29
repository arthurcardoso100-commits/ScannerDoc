import { openDB } from 'idb';

const DB_NAME = 'aso-validator-db';
const STORE_NAME = 'files';

const initDB = async () => {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        },
    });
};

export const saveExcelFile = async (file: File): Promise<void> => {
    const db = await initDB();
    await db.put(STORE_NAME, file, 'excelFile');
};

export const getExcelFile = async (): Promise<File | undefined> => {
    const db = await initDB();
    return db.get(STORE_NAME, 'excelFile');
};
