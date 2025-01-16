// バリデーション結果の型定義
export interface ValidationResult {
  isValid: boolean;
  recordCountMatch: boolean;
  excelRecordCount: number;
  jsonRecordCount: number;
  schemaErrors: ValidationError[];
  dateErrors: ValidationError[];
  errors: ValidationError[];      // 追加
  warnings: ValidationError[];    // 追加
  totalErrors: number;
  totalWarnings: number;         // 追加
  excelData: any[];
}

// バリデーションエラーの型定義
export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: any;
  type: 'error' | 'warning';
}

// バリデーション設定の型定義
export interface ValidationConfig {
  strictMode: boolean;  // 厳格モード（警告もエラーとして扱う）
  skipEmptyRows: boolean;  // 空行をスキップするかどうか
  validateJsonMatch: boolean;  // JSONとの一致をチェックするかどうか
}

// バリデーション種別の定義
export enum ValidationType {
  Required = 'required',
  DataType = 'dataType',
  Format = 'format',
  Length = 'length',
  Regex = 'regex',
  Enum = 'enum',
  Custom = 'custom'
}

// データ型の定義
export enum DataType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  StringArray = 'array[string]'
}

// フォーマット種別の定義
export enum FormatType {
  Date = 'date',
  Time = 'time',
  Email = 'email',
  Uri = 'uri',
  PostalCode = 'postalCode',
  Custom = 'custom'
}