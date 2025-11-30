import React, { useState, useEffect } from "react";
import { FileText, Database, Search, Play, RotateCcw, Save, Trash2 } from "lucide-react";
import { FileUpload } from "./components/FileUpload";
import { ResultCard } from "./components/ResultCard";
import { processASOWithGemini } from "./services/geminiService";
import { parseExcelAndFindEmployee, findEmployeeByCPF } from "./services/excelService";
import { saveExcelFile, getExcelFile, clearExcelFile } from "./services/storageService";
import { normalizeText, normalizeNumber, normalizeCargo, parseDateString } from "./utils/normalization";
import { AppState } from "./types";
import type { ASOData, ValidationResult } from "./types";

const App: React.FC = () => {
  // Inputs
  const [asoPdfs, setAsoPdfs] = useState<File[]>([]);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [fileInitials, setFileInitials] = useState<Record<string, string>>({});
  const [isExcelSaved, setIsExcelSaved] = useState(false);

  // State
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [statusMessage, setStatusMessage] = useState("");
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [rawGeminiData, setRawGeminiData] = useState<ASOData | null>(null);

  // Load saved excel on mount
  useEffect(() => {
    const loadPersistence = async () => {
      const saved = await getExcelFile();
      if (saved) {
        setExcelFile(saved);
        setIsExcelSaved(true);
      }
    };
    loadPersistence();
  }, []);

  const handleExcelSelect = async (file: File) => {
    setExcelFile(file);
    setIsExcelSaved(true);
    try {
      await saveExcelFile(file);
    } catch (e) {
      console.error("Failed to auto-save excel", e);
    }
  };

  const handleClearDatabase = async () => {
    if (confirm("Are you sure you want to clear the saved Excel database?")) {
      await clearExcelFile();
      setExcelFile(null);
      setIsExcelSaved(false);
    }
  };

  const reset = () => {
    setAppState(AppState.IDLE);
    setValidationResult(null);
    setRawGeminiData(null);
    setStatusMessage("");
    setAsoPdfs([]); // Clear previous PDFs
  };

  const handleProcess = async () => {
    if (asoPdfs.length === 0 || !excelFile) {
      alert("Please upload Excel and at least one PDF.");
      return;
    }

    try {
      setAppState(AppState.PROCESSING);

      // 1. Process Excel
      setStatusMessage("Scanning Excel database...");
      // First try to find by CPF after processing each PDF
      const results: ValidationResult[] = [];
      const rawDataArray: ASOData[] = [];

      for (const pdfFile of asoPdfs) {
        // Process PDF with Gemini
        setStatusMessage(`Analyzing PDF ${pdfFile.name} with Gemini AI...`);
        const pdfData = await processASOWithGemini(import.meta.env.VITE_API_KEY, pdfFile);
        rawDataArray.push(pdfData);

        // Try to find employee by CPF from Excel
        let excelData = await findEmployeeByCPF(excelFile, pdfData.cpf);
        // Fallback to initials (search code) if not found by CPF
        if (!excelData) {
          const specificInitials = fileInitials[pdfFile.name] || "";
          if (specificInitials) {
            excelData = await parseExcelAndFindEmployee(excelFile, specificInitials);
          }
        }
        if (!excelData) {
          throw new Error(`Employee not found in Excel for PDF ${pdfFile.name}. Check CPF or Initials.`);
        }

        // Validate data for this PDF
        const result = (() => {
          const pdfNameNorm = normalizeText(pdfData.nome);
          const pdfCpfNorm = normalizeNumber(pdfData.cpf);
          const pdfCargoNorm = normalizeCargo(pdfData.cargo);

          const baseNameNorm = normalizeText(excelData.nome);
          const baseCpfNorm = normalizeNumber(excelData.cpf);
          const baseCargoNorm = normalizeCargo(excelData.cargo);

          const aptFlags = pdfData.aptidoes;
          const aptitudeErrors: string[] = [];
          if (!aptFlags.funcao) aptitudeErrors.push("Inapto: Função");
          if (!aptFlags.altura) aptitudeErrors.push("Inapto: Altura");
          if (!aptFlags.espacoConfinado) aptitudeErrors.push("Inapto: Espaço Confinado");
          if (!aptFlags.eletricidade) aptitudeErrors.push("Inapto: Eletricidade");

          // Date validation
          let dateValid = false;
          let dateMsg = "Date missing or not found";
          const rawDate = pdfData.assinaturas.data;
          if (rawDate) {
            const parsedDate = parseDateString(rawDate);
            if (parsedDate) {
              const today = new Date();
              const oneYearAgo = new Date();
              oneYearAgo.setFullYear(today.getFullYear() - 1);
              today.setHours(0, 0, 0, 0);
              oneYearAgo.setHours(0, 0, 0, 0);
              parsedDate.setHours(0, 0, 0, 0);
              if (parsedDate >= oneYearAgo) {
                dateValid = true;
                dateMsg = `${rawDate}`;
              } else {
                dateMsg = `${rawDate} (Expired / Old)`;
              }
            } else {
              dateMsg = `${rawDate} (Invalid Format)`;
            }
          }

          return {
            nome: {
              ok: pdfNameNorm === baseNameNorm,
              msg: pdfNameNorm === baseNameNorm ? "Match" : "Mismatch",
              pdfVal: pdfData.nome || "(Empty)",
              baseVal: excelData.nome,
            },
            cpf: {
              ok: pdfCpfNorm === baseCpfNorm,
              msg: pdfCpfNorm === baseCpfNorm ? "Match" : "Mismatch",
              pdfVal: pdfData.cpf || "(Empty)",
              baseVal: excelData.cpf,
            },
            cargo: {
              ok: pdfCargoNorm === baseCargoNorm,
              msg: pdfCargoNorm === baseCargoNorm ? "Match" : "Mismatch",
              pdfVal: pdfData.cargo || "(Empty)",
              baseVal: excelData.cargo,
            },
            aptidao: {
              ok: aptitudeErrors.length === 0,
              msg: aptitudeErrors.length === 0 ? "All Clear" : "Issues Found",
              failedFields: aptitudeErrors,
            },
            assinaturas: {
              medico: pdfData.assinaturas.medico,
              tecnico: pdfData.assinaturas.tecnico,
              data: { valid: dateValid, value: rawDate, msg: dateMsg },
            },
          } as ValidationResult;
        })();
        results.push(result);
      }

      // After processing all PDFs, set state
      setValidationResult(results[0]); // show first result initially
      setRawGeminiData(rawDataArray[0]); // show first raw data initially
      setAppState(AppState.SUCCESS);
      return;


      // NOTE: Legacy single-PDF processing code retained for reference but not used in batch mode.
      /*
        setStatusMessage("Analyzing PDF with Gemini AI...");
        const apiKey = import.meta.env.VITE_API_KEY;
        if (!apiKey) {
          throw new Error("API Key not found. Please set VITE_API_KEY in .env file.");
        }
        const pdfData = await processASOWithGemini(apiKey, asoPdf);
        setRawGeminiData(pdfData);
      
        setStatusMessage("Validating data...");
        validateData(pdfData, excelData);
      */
    } catch (error: any) {
      console.error(error);
      setAppState(AppState.ERROR);
      setStatusMessage(error.message || "An unexpected error occurred.");
    }
  };



  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <FileText className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">ASO Validator AI</h1>
              <p className="text-xs text-slate-500">Automated Document Compliance</p>
            </div>
          </div>
          {appState === AppState.SUCCESS && (
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              New Validation
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Step 1: Configuration & Inputs */}
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 ${appState === AppState.SUCCESS ? 'hidden lg:grid' : ''}`}>

          {/* Left Column: Inputs */}
          <div className="lg:col-span-1 space-y-6">

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                Reference Data
              </h2>
              <div className="space-y-4">
                <div>
                  <FileUpload
                    label="Training Control Excel"
                    accept=".xlsx, .xls"
                    files={excelFile ? [excelFile] : []}
                    onFilesChange={(files) => {
                      if (files.length > 0) handleExcelSelect(files[0]);
                      else {
                        setExcelFile(null);
                        setIsExcelSaved(false);
                      }
                    }}
                    multiple={false}
                    icon={<Database className="w-8 h-8 text-slate-400 mb-2" />}
                  />
                  {isExcelSaved && excelFile && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 font-medium">
                      <Save className="w-3 h-3" />
                      Saved to browser storage
                    </div>
                  )}
                  {isExcelSaved && (
                    <button
                      onClick={handleClearDatabase}
                      className="mt-3 flex items-center gap-2 text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear Database
                    </button>
                  )}
                </div>

              </div>

              {/* Removed global initials input */}
            </div>
          </div>


          {/* Center Column: PDF Upload */}
          <div className="lg:col-span-2 flex flex-col h-full">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Document Input
              </h2>
              <div className="flex-1 flex flex-col justify-center">
                <FileUpload
                  label="Upload ASO (PDF)"
                  accept=".pdf"
                  files={asoPdfs}
                  onFilesChange={setAsoPdfs}
                  multiple={true}
                  showList={false}
                />

                {/* Custom File List with Initials Input */}
                {asoPdfs.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h3 className="text-sm font-medium text-slate-700">Selected Files</h3>
                    {asoPdfs.map((file, index) => (
                      <div key={`${file.name}-${index}`} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex-1 min-w-0 flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-md">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                            <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <div className="relative flex-1 sm:w-40">
                            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                              <Search className="h-3 w-3 text-slate-400" />
                            </div>
                            <input
                              type="text"
                              value={fileInitials[file.name] || ""}
                              onChange={(e) => setFileInitials(prev => ({ ...prev, [file.name]: e.target.value }))}
                              placeholder="Initials"
                              className="block w-full pl-7 pr-2 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 uppercase"
                            />
                          </div>
                          <button
                            onClick={() => {
                              const newFiles = [...asoPdfs];
                              newFiles.splice(index, 1);
                              setAsoPdfs(newFiles);
                              const newInitials = { ...fileInitials };
                              delete newInitials[file.name];
                              setFileInitials(newInitials);
                            }}
                            className="p-1.5 hover:bg-red-100 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                            title="Remove file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <button
                  onClick={handleProcess}
                  disabled={appState === AppState.PROCESSING}
                  className={`w-full py-3 px-6 rounded-lg font-semibold text-white shadow-md flex items-center justify-center gap-2 transition-all
                    ${appState === AppState.PROCESSING
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'}`}
                >
                  {appState === AppState.PROCESSING ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      Run Validation
                    </>
                  )}
                </button>
                {statusMessage && (
                  <p className="text-center text-sm text-slate-500 mt-3 animate-pulse">
                    {statusMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {
          appState === AppState.SUCCESS && validationResult && (
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Validation Results</h2>
                <div className="text-sm text-slate-500">
                  Comparing <span className="font-semibold text-slate-700">{asoPdfs.length} PDF(s)</span> vs Database
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* 1. Name Validation */}
                <ResultCard
                  title="Employee Name"
                  status={validationResult.nome.ok ? "success" : "error"}
                  message={validationResult.nome.msg}
                  details={[
                    { label: "PDF", value: validationResult.nome.pdfVal },
                    { label: "Base", value: validationResult.nome.baseVal }
                  ]}
                />

                {/* 2. CPF Validation */}
                <ResultCard
                  title="CPF Document"
                  status={validationResult.cpf.ok ? "success" : "error"}
                  message={validationResult.cpf.msg}
                  details={[
                    { label: "PDF", value: validationResult.cpf.pdfVal },
                    { label: "Base", value: validationResult.cpf.baseVal }
                  ]}
                />

                {/* 3. Role Validation */}
                <ResultCard
                  title="Job Role / Cargo"
                  status={validationResult.cargo.ok ? "success" : "error"}
                  message={validationResult.cargo.msg}
                  details={[
                    { label: "PDF", value: validationResult.cargo.pdfVal },
                    { label: "Base", value: validationResult.cargo.baseVal }
                  ]}
                />

                {/* 4. Aptitude Flags */}
                <ResultCard
                  title="Health Aptitude"
                  status={validationResult.aptidao.ok ? "success" : "error"}
                  message={validationResult.aptidao.ok ? "Fully Fit / Apto" : "Unfit / Inapto Detected"}
                  details={!validationResult.aptidao.ok ? validationResult.aptidao.failedFields.map(f => ({ label: "Issue", value: f })) : undefined}
                />

                {/* 5. Signatures */}
                <div className="col-span-1 md:col-span-2 grid grid-cols-3 gap-4">
                  <ResultCard
                    title="Physician Sign."
                    status={validationResult.assinaturas.medico ? "success" : "error"}
                    message={validationResult.assinaturas.medico ? "Detected" : "Missing"}
                  />
                  <ResultCard
                    title="Employee Sign."
                    status={validationResult.assinaturas.tecnico ? "success" : "error"}
                    message={validationResult.assinaturas.tecnico ? "Detected" : "Missing"}
                  />
                  <ResultCard
                    title="Date Field"
                    status={validationResult.assinaturas.data.valid ? "success" : "error"}
                    message={validationResult.assinaturas.data.msg}
                  />
                </div>
              </div>

              {/* Raw Data Toggle (Optional) */}
              <div className="mt-12 border-t pt-8">
                <details className="group">
                  <summary className="flex items-center gap-2 cursor-pointer text-slate-500 hover:text-blue-600 transition-colors">
                    <Database className="w-4 h-4" />
                    <span className="text-sm font-medium">View Raw Extracted Data (JSON)</span>
                  </summary>
                  <pre className="mt-4 p-4 bg-slate-900 text-slate-50 rounded-lg overflow-auto text-xs font-mono max-h-60">
                    {JSON.stringify(rawGeminiData, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          )
        }

        {
          appState === AppState.ERROR && (
            <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-xl text-center">
              <h3 className="text-lg font-bold text-red-700 mb-2">Process Failed</h3>
              <p className="text-red-600 mb-4">{statusMessage}</p>
              <button
                onClick={() => setAppState(AppState.IDLE)}
                className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors"
              >
                Try Again
              </button>
            </div>
          )
        }
      </main >
    </div >
  );
};

export default App;
