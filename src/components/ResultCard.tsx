import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ResultCardProps {
    title: string;
    status: 'success' | 'error' | 'warning';
    message: string;
    details?: { label: string; value: string | undefined }[];
}

export const ResultCard: React.FC<ResultCardProps> = ({ title, status, message, details }) => {
    const getIcon = () => {
        switch (status) {
            case 'success': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
            case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
            case 'warning': return <AlertCircle className="w-5 h-5 text-amber-500" />;
        }
    };

    const getBgColor = () => {
        switch (status) {
            case 'success': return 'bg-emerald-50 border-emerald-100';
            case 'error': return 'bg-red-50 border-red-100';
            case 'warning': return 'bg-amber-50 border-amber-100';
        }
    };

    return (
        <div className={`p-4 rounded-xl border ${getBgColor()}`}>
            <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-slate-800">{title}</h3>
                {getIcon()}
            </div>
            <p className={`text-sm font-medium mb-3 ${status === 'success' ? 'text-emerald-700' :
                    status === 'error' ? 'text-red-700' : 'text-amber-700'
                }`}>
                {message}
            </p>

            {details && details.length > 0 && (
                <div className="space-y-1 pt-3 border-t border-black/5">
                    {details.map((detail, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                            <span className="text-slate-500">{detail.label}:</span>
                            <span className="font-medium text-slate-700 truncate max-w-[120px]" title={detail.value}>
                                {detail.value || '-'}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
