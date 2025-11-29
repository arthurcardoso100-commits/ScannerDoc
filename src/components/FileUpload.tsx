import React, { useRef } from 'react';
import { Upload, File as FileIcon } from 'lucide-react';

interface FileUploadProps {
    label: string;
    accept: string;
    file: File | null;
    onFileSelect: (file: File) => void;
    icon?: React.ReactNode;
}

export const FileUpload: React.FC<FileUploadProps> = ({ label, accept, file, onFileSelect, icon }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
        }
    };

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>

            {!file ? (
                <div
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer group"
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept={accept}
                        onChange={handleChange}
                        className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center">
                        {icon || <Upload className="w-8 h-8 text-slate-400 mb-2 group-hover:text-blue-500 transition-colors" />}
                        <p className="text-sm text-slate-600 font-medium">
                            Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            {accept.replace(/\./g, '').toUpperCase()} files only
                        </p>
                    </div>
                </div>
            ) : (
                <div className="relative bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-md">
                        <FileIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                        <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            // We need a way to clear, but the prop only accepts a file. 
                            // For now, we can just trigger the input again to replace, 
                            // or maybe the parent should handle clearing if we passed null.
                            // But the interface says onFileSelect(file: File).
                            // Let's just allow replacing by clicking the area if we wanted, 
                            // but here we are in "selected" state.
                            // To clear, we might need to change the interface or just re-open input.
                            inputRef.current?.click();
                        }}
                        className="p-1 hover:bg-blue-100 rounded-full text-slate-500 hover:text-blue-600 transition-colors"
                        title="Replace file"
                    >
                        <Upload className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};
