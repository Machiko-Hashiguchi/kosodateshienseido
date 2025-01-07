import React from 'react';

export interface FileUploadProps {
  label: string;
  accept: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  file: File | null;
  error?: string;
}

export function FileUpload({ label, accept, onChange, file }: FileUploadProps) {
  return (
    <div className="p-4 border rounded-lg">
      <p className="mb-2 font-medium">{label}</p>
      <input
        type="file"
        accept={accept}
        onChange={onChange}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100"
      />
      {file && (
        <p className="mt-2 text-sm text-gray-500">
          選択済み: {file.name}
        </p>
      )}
    </div>
  );
}