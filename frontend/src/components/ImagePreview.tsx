import React from 'react';

interface ImagePreviewProps {
    file: File;
    previewUrl: string;
    isOneTime: boolean;
    onOneTimeChange: (value: boolean) => void;
    onSend: () => void;
    onCancel: () => void;
    sending: boolean;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
    file,
    previewUrl,
    isOneTime,
    onOneTimeChange,
    onSend,
    onCancel,
    sending,
}) => {
    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-semibold">Send Image</h3>
                        <p className="text-gray-400 text-sm">{formatFileSize(file.size)}</p>
                    </div>
                </div>

                {/* Image Preview */}
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-900">
                    <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-w-full max-h-full rounded-lg object-contain"
                    />
                </div>

                {/* Options */}
                <div className="p-4 border-t border-gray-700">
                    <button
                        type="button"
                        onClick={() => onOneTimeChange(!isOneTime)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition ${isOneTime
                                ? 'bg-blue-600/20 border border-blue-600/50'
                                : 'bg-gray-700 hover:bg-gray-650 border border-transparent'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition ${isOneTime ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-400'
                                }`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </div>
                            <div className="text-left">
                                <p className="text-white font-medium text-sm">View Once</p>
                                <p className="text-gray-400 text-xs">Photo disappears after viewing</p>
                            </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition border ${isOneTime ? 'bg-blue-600 border-blue-600' : 'border-gray-500'
                            }`}>
                            {isOneTime && (
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={sending}
                        className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSend}
                        disabled={sending}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {sending ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Uploading...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                Send
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImagePreview;