import { read, utils } from 'xlsx';
import Papa from 'papaparse';
import { ValidationResult, ValidationError } from '../types/validation';
import { SchemaField } from '../types/schema';

class Validator {
  private schema: SchemaField[];

  constructor(schema: SchemaField[]) {
    this.schema = schema;
  }

  validateData(row: any): ValidationError[] {
    const errors: ValidationError[] = [];
    
    this.schema.forEach(field => {
      const value = row[field.field_path];
      
      // 値の正規化（前後の空白を除去、"null"文字列の処理）
      const normalizedValue = this.normalizeValue(value);
      
      if (field.required === 'true') {
        // 必須項目の検証
        if (this.isEmpty(normalizedValue)) {
          errors.push(this.createError(field.field_path, value, `${field.field_path}は必須項目です`, 'error'));
          return;
        }
        this.validateField(field, normalizedValue, errors);
      } else {
        // 任意項目の検証（空でない場合のみ）
        if (!this.isEmpty(normalizedValue)) {
          this.validateField(field, normalizedValue, errors);
        }
      }
    });

    return errors;
  }

  private isEmpty(value: any): boolean {
    // null、undefined、"null"文字列のチェック
    if (value === null || value === undefined || 
        (typeof value === 'string' && value.toLowerCase() === 'null')) {
      return true;
    }
    
    // 文字列の場合
    if (typeof value === 'string') {
      return value.trim() === '';
    }
    
    // 配列の場合
    if (Array.isArray(value)) {
      // 空の配列、または全要素が空の場合をチェック
      return value.length === 0 || value.every(v => this.isEmpty(v));
    }
    
    // オブジェクトの場合
    if (typeof value === 'object') {
      // 全プロパティが空の場合をチェック
      return Object.values(value).every(v => this.isEmpty(v));
    }
    
    return false;
  }

  private normalizeValue(value: any): any {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.toLowerCase() === 'null' ? null : trimmed;
    }
    return value;
  }

  private validateField(field: SchemaField, value: any, errors: ValidationError[]): void {
    // 値の正規化
    const normalizedValue = this.normalizeValue(value);

    // データ型チェック
    const typeError = this.validateDataType(field, normalizedValue);
    if (typeError) {
      errors.push(this.createError(field.field_path, value, typeError, 'error'));
      return;
    }

    // validation_typeが存在する場合のチェック
    if (field.validation_type && !this.isEmpty(normalizedValue)) {
      const formatError = this.validateFormat(field, normalizedValue);
      if (formatError) {
        errors.push(this.createError(field.field_path, value, formatError, 'error'));
      }
    }

    // 文字列長チェック
    if (field.data_type === 'string' && !this.isEmpty(normalizedValue) && 
        (field.min_length || field.max_length)) {
      const lengthError = this.validateLength(field, normalizedValue);
      if (lengthError) {
        errors.push(this.createError(field.field_path, value, lengthError, 'error'));
      }
    }

    // 許容値チェック
    if (field.allowed_values && !this.isEmpty(normalizedValue)) {
      const allowedError = this.validateAllowedValues(field, normalizedValue);
      if (allowedError) {
        errors.push(this.createError(field.field_path, value, allowedError, 'error'));
      }
    }
  }

  private createError(field: string, value: any, message: string, type: 'error' | 'warning'): ValidationError {
    return {
      row: 0,  // row numberは上位で設定
      field,
      value,
      message,
      type
    };
  }

  private validateDataType(field: SchemaField, value: any): string | null {
    if (this.isEmpty(value)) return null;

    const normalizedValue = this.normalizeValue(value);
    
    switch (field.data_type) {
      case 'string':
        return typeof normalizedValue === 'string' ? null : 'テキスト形式ではありません';
      
      case 'number':
        // 数値変換とバリデーション
        if (typeof normalizedValue === 'number') return null;
        const num = Number(normalizedValue);
        if (isNaN(num)) return '数値形式ではありません';
        return null;
      
      case 'boolean':
        const validBooleans = ['t', 'f', 'true', 'false'];
        const boolStr = String(normalizedValue).toLowerCase();
        return validBooleans.includes(boolStr) ? null : 'TまたはFで入力してください';
      
      case 'array[string]':
        // 文字列でない場合はエラー
         if (typeof normalizedValue !== 'string') {
           return '配列形式ではありません';
         }
        
         // 正規表現による検証
         if (field.validation_rule) {
           try {
             const regex = new RegExp(field.validation_rule);
             
             // 入力値を配列に変換（カンマ区切りの場合は分割、そうでない場合は単一要素の配列に）
             const values = normalizedValue.includes(',') 
               ? normalizedValue.split(',')
               : [normalizedValue];
             
             // 各値をトリムして空値を除去
             const trimmedValues = values
               .map(v => v.trim())
               .filter(v => v !== '' && v.toLowerCase() !== 'null');
        
             // すべての値に対して正規表現チェック
             const invalidValues = trimmedValues.filter(v => !regex.test(v));
            
              if (invalidValues.length > 0) {
                return `次の値が正しくありません: ${invalidValues.join(', ')}`;
              }
            } catch {
              return 'バリデーションルールの形式が不正です';
            }
          }
          return null;
      
      
      default:
        return `未対応のデータ型です: ${field.data_type}`;
    }
  }

  private validateFormat(field: SchemaField, value: string): string | null {
    if (this.isEmpty(value)) return null;
    const stringValue = String(value).trim();
    
    if (!field.format) return null;

    switch (field.validation_type) {
      case 'date':
        return this.validateDate(stringValue);
      case 'time':
        return this.validateTime(stringValue);
      case 'email':
        return this.validateEmail(stringValue);
      case 'uri':
        return this.validateUri(stringValue);
      case 'regex':
        return this.validateRegex(stringValue, field.validation_rule);
      default:
        return null;
    }
  }

  private validateDate(value: string): string | null {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) return 'YYYY-MM-DD形式で入力してください';
    const date = new Date(value);
    return isNaN(date.getTime()) ? '無効な日付です' : null;
  }

  private validateTime(value: string): string | null {
    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value) ? null : 'HH:MM形式で入力してください';
  }

  private validateEmail(value: string): string | null {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : 'メールアドレスの形式が不正です';
  }

  private validateUri(value: string): string | null {
    try {
      new URL(value);
      return null;
    } catch {
      return 'URIの形式が不正です';
    }
  }

  private validateRegex(value: string, pattern?: string): string | null {
    if (!pattern) return 'バリデーションパターンが設定されていません';
    try {
      const regex = new RegExp(pattern);
      return regex.test(value) ? null : '指定された形式に従っていません';
    } catch {
      return 'バリデーションルールの形式が不正です';
    }
  }

  private validateLength(field: SchemaField, value: string): string | null {
    const length = String(value).length;
    const min = field.min_length ? parseInt(field.min_length) : null;
    const max = field.max_length ? parseInt(field.max_length) : null;
    
    if (min !== null && length < min) return `${min}文字以上で入力してください`;
    if (max !== null && length > max) return `${max}文字以内で入力してください`;
    return null;
  }

  private validateAllowedValues(field: SchemaField, value: any): string | null {
    if (!field.allowed_values || this.isEmpty(value)) return null;

    const allowedValues = field.allowed_values.split(';').map(v => v.trim());
    const stringValue = String(value).trim();

    if (field.data_type === 'array[string]') {
      // 文字列でない場合はエラー
      if (typeof value !== 'string') {
        return '配列形式ではありません';
      }
    
      // 正規表現による検証
      if (field.validation_rule) {
        try {
          const regex = new RegExp(field.validation_rule);
          
          // 入力値を配列に変換（カンマ区切りの場合は分割、そうでない場合は単一要素の配列に）
          const values = value.includes(',') 
            ? value.split(',')
            : [value];
          
          // 各値をトリムして空値を除去
          const trimmedValues = values
            .map(v => v.trim())
            .filter(v => v !== '' && v.toLowerCase() !== 'null');
          
          // すべての値に対して正規表現チェック
          const invalidValues = trimmedValues.filter(v => !regex.test(v));
          
          if (invalidValues.length > 0) {
            return `次の値が正しくありません: ${invalidValues.join(', ')}`;
          }
        } catch {
          return 'バリデーションルールの形式が不正です';
        }
      }    
      return null;
    }

    return allowedValues.includes(stringValue) ? null :
      `許容値の範囲外です (許容値: ${allowedValues.join(', ')})`;
  }
}

export async function validateFiles(
  excelFile: File,
  jsonFile: File,
  schemaFile: File
): Promise<ValidationResult> {
  try {
    const schema = await loadAndValidateSchema(schemaFile);
    const excelData = await loadExcelData(excelFile);
    const jsonData = await loadJsonData(jsonFile);
    const validator = new Validator(schema);

    const schemaErrors: ValidationError[] = [];
    const dateErrors: ValidationError[] = [];

    // 各行のバリデーション
    excelData.forEach((row, rowIndex) => {
      if (isEmptyRow(row)) return;

      const rowErrors = validator.validateData(row);
      if (!rowErrors) return;
      
      rowErrors.forEach(error => {
        const finalError = {
          ...error,
          row: rowIndex + 1
        };
        if (error.type === 'warning') {
          dateErrors.push(finalError);
        } else {
          schemaErrors.push(finalError);
        }
      });
    });

    const totalErrors = schemaErrors.length + dateErrors.length;

    return {
      isValid: totalErrors === 0,
      recordCountMatch: excelData.length === jsonData.length,
      excelRecordCount: excelData.length,
      jsonRecordCount: jsonData.length,
      schemaErrors,
      dateErrors,
      totalErrors,
      excelData,
      errors: schemaErrors,
      warnings: dateErrors,
      totalWarnings: dateErrors.length
    };

  } catch (error) {
    console.error('Validation process failed:', error);
    throw new Error(`バリデーション処理中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
}

async function loadAndValidateSchema(file: File): Promise<SchemaField[]> {
  const text = await file.text();
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const schema = results.data as SchemaField[];
          validateSchemaStructure(schema);
          resolve(schema);
        } catch (error) {
          reject(error);
        }
      },
      error: (error: Error) => reject(new Error(`スキーマファイルの解析に失敗しました: ${error.message}`))
    });
  });
}

function validateSchemaStructure(schema: SchemaField[]): void {
  const requiredColumns = ['field_path', 'data_type', 'required'];
  const firstRow = schema[0];
  
  if (!firstRow) {
    throw new Error('スキーマが空です');
  }

  const missingColumns = requiredColumns.filter(col => !(col in firstRow));
  if (missingColumns.length > 0) {
    throw new Error(`必須カラムが不足しています: ${missingColumns.join(', ')}`);
  }
}

async function loadExcelData(file: File): Promise<any[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = read(arrayBuffer, {
    type: 'array',
    cellDates: true,
    cellNF: true,
    cellText: true
  });
  
  const firstSheet = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheet];
  
  return utils.sheet_to_json(worksheet, {
    raw: false,
    defval: null,
    blankrows: false
  });
}

async function loadJsonData(file: File): Promise<any[]> {
  const text = await file.text();
  return JSON.parse(text);
}

function isEmptyRow(row: any): boolean {
  if (!row || typeof row !== 'object') return true;
  return Object.values(row).every(value => {
    if (value === null || value === undefined || 
        (typeof value === 'string' && value.toLowerCase() === 'null')) {
      return true;
    }
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    return false;
  });
}