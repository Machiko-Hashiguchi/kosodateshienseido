export interface ValidationError {
  row: number;
  column: string;
  message: string;
  value?: any;
  type: string;
}

export interface ValidationResult {
  isValid: boolean;
  recordCountMatch: boolean;
  excelRecordCount: number;
  jsonRecordCount: number;
  schemaErrors: ValidationError[];
  dateErrors: ValidationError[];
  totalErrors: number;
  excelData: any[];
}

export interface DataSchema {
  field_path: string;
  data_type: 'string' | 'number' | 'boolean' | 'date' | 'array[string]';
  required: string;  // 'true' または 'false' の文字列として扱う
  allowed_values?: string;
  description?: string;
  format?: string;  // 追加: date型などのフォーマット指定
  validation_rules?: string;
}