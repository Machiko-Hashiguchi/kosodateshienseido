export interface ValidationError {
  row: number;
  column: string;
  message: string;
  value?: unknown;
  type: string;
}

export interface ValidationResult {
  isValid: boolean;
  recordCountMatch: boolean;
  excelRecordCount: number;
  jsonRecordCount: number;
  formattingErrors: ValidationError[];
  schemaErrors: ValidationError[];
  dateErrors: ValidationError[];
  totalErrors: number;
}

export interface DataSchema {
  field_path: string;
  json_path_1: string;
  json_path_2: string;
  json_path_3: string;
  data_type: string;
  required: boolean;
  description: string;
  format: string;
  allowed_values: string;
  validation_rules: string;
}