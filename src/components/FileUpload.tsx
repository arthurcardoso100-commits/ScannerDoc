import React, { useRef } from 'react';
import { Upload, File as FileIcon, X } from 'lucide-react';

interface FileUploadProps {
    label: string;
    accept: string;
    files: File[];
    onFilesChange: (files: File[]) => void;
    multiple?: boolean;
    showList?: boolean;
    icon?: React.ReactNode;
}

export const FileUpload: React.FC<FileUploadProps> = ({ label, accept, files, onFilesChange, multiple = false, showList = true, icon }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const newFiles = Array.from(e.dataTransfer.files);
            if (multiple) {
                // Filter duplicates based on name and size
                const uniqueNewFiles = newFiles.filter(nf => !files.some(ef => ef.name === nf.name && ef.size === nf.size));
                onFilesChange([...files, ...uniqueNewFiles]);
            } else {
                onFilesChange([newFiles[0]]);
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            if (multiple) {
                const uniqueNewFiles = newFiles.filter(nf => !files.some(ef => ef.name === nf.name && ef.size === nf.size));
                onFilesChange([...files, ...uniqueNewFiles]);
            } else {
                onFilesChange([newFiles[0]]);
            }
        }
        // Reset input so same file can be selected again if needed
        if (inputRef.current) inputRef.current.value = '';
    };

    const removeFile = (index: number) => {
        const newFiles = [...files];
        newFiles.splice(index, 1);
        onFilesChange(newFiles);
    };

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>

            {/* Drop Zone */}
            <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className={`border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer group ${files.length > 0 && !multiple ? 'hidden' : ''}`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleChange}
                    className="hidden"
                />
                <div className="flex flex-col items-center justify-center">
                    {icon || <Upload className="w-8 h-8 text-slate-400 mb-2 group-hover:text-blue-500 transition-colors" />}
                    <p className="text-sm text-slate-600 font-medium">
                        {files.length > 0 && multiple ? "Add more files" : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                        {accept.replace(/\./g, '').toUpperCase()} files only
                    </p>
                </div>
            </div>

            {/* File List */}
            {showList && files.length > 0 && (
                <div className={`flex flex-col gap-2 ${multiple ? 'mt-4' : ''}`}>
                    {files.map((file, index) => (
                        <div key={`${file.name}-${index}`} className="relative bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="bg-blue-100 p-2 rounded-md">
                                <FileIcon className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeFile(index);
                                }}
                                className="p-1 hover:bg-red-100 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                                title="Remove file"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
