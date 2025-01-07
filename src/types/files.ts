export type FileType = 'excel' | 'json' | 'schema';

export interface FileState {
  excel: File | null;
  json: File | null;
  schema: File | null;
}

export interface FileUploadProps {
  type: FileType;
  label: string;
  accept: string;
  onFileChange: (file: File) => void;
  currentFile: File | null;
  error?: string;
}

// types/validation.ts
export interface ValidationError {
  row: number;
  column: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  recordCountMatch: boolean;
  excelRecordCount: number;
  jsonRecordCount: number;
  formattingErrors: ValidationError[];
  schemaErrors: ValidationError[];
  dateErrors: ValidationError[];
}