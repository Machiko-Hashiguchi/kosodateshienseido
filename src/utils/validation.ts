import { read, utils } from 'xlsx';
import Papa from 'papaparse';
import type { ValidationError, ValidationResult, DataSchema } from '../types/validation';

export async function validateFiles(
  excelFile: File,
  jsonFile: File,
  schemaFile: File
): Promise<ValidationResult> {
  try {
    // スキーマの読み込み
    const schemaText = await schemaFile.text();
    const schema = await new Promise<DataSchema[]>((resolve) => {
      Papa.parse(schemaText, {
        header: true,
        complete: (results) => resolve(results.data as DataSchema[]),
      });
    });

    // Excelファイルの読み込み
    const excelData = await readExcelFile(excelFile);
    
    // JSONファイルの読み込み
    const jsonText = await jsonFile.text();
    const jsonData = JSON.parse(jsonText);

    // バリデーション実行
    const result: ValidationResult = {
      isValid: true,
      recordCountMatch: excelData.length === jsonData.length,
      excelRecordCount: excelData.length,
      jsonRecordCount: jsonData.length,
      schemaErrors: validateAgainstSchema(excelData, schema),
      dateErrors: validateDates(excelData),
      totalErrors: 0,
      excelData: excelData
    };

    result.totalErrors = 
      result.schemaErrors.length + 
      result.dateErrors.length;
    
    result.isValid = result.totalErrors === 0 && result.recordCountMatch;

    return result;
  } catch (error) {
    throw new Error('バリデーション処理中にエラーが発生しました');
  }
}

async function readExcelFile(file: File): Promise<Record<string, unknown>[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = read(arrayBuffer, {
    type: 'array',
    cellDates: true,
    cellNF: true,
    cellText: false
  });
  
  const firstSheet = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheet];
  
  // デバッグログ: ワークシートの内容を確認
  console.log('Worksheet:', worksheet);
  
  const data = utils.sheet_to_json(worksheet, {
    raw: true,
    defval: null,
    blankrows: false
  }) as Record<string, unknown>[];
  
  // デバッグログ: 変換後のデータを確認
  if (data.length > 0) {
    console.log('First row keys:', Object.keys(data[0]));
    console.log('First row data:', data[0]);
  }
  
  return data;
}

function validateAgainstSchema(data: any[], schema: DataSchema[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // スキーマのマップを作成
  const schemaMap = new Map(
    schema.map(s => [s.field_path, s])
  );
  
  data.forEach((row, rowIndex) => {
    // Excelの各列についてバリデーション
    Object.entries(row).forEach(([field, value]) => {
      const schemaField = schemaMap.get(field);
      
      if (!schemaField) {
        errors.push({
          row: rowIndex + 1,
          column: field,
          value: value,
          message: '未定義のフィールドです',
          type: 'error'
        });
        return;
      }

      // 必須チェック
      if (schemaField.required === 'true' && (value === null || value === '')) {
        errors.push({
          row: rowIndex + 1,
          column: field,
          value: value,
          message: '必須項目が入力されていません',
          type: 'error'
        });
        return;
      }

      // 値が存在する場合のみ、データ型と許容値をチェック
      if (value !== null && value !== '') {
        // データ型チェック
        const typeError = validateDataType(value, schemaField, rowIndex + 1, field);
        if (typeError) {
          errors.push(typeError);
          return;
        }

        // 許容値チェック
        if (schemaField.allowed_values) {
          const allowedValues = schemaField.allowed_values.split(',').map(v => v.trim());
          if (!allowedValues.includes(String(value))) {
            errors.push({
              row: rowIndex + 1,
              column: field,
              value: value,
              message: `許容値の範囲外です (許容値: ${allowedValues.join(', ')})`,
              type: 'error'
            });
          }
        }
      }
    });
  });

  return errors;
}

function validateDataType(
  value: any,
  schema: DataSchema,
  rowNum: number,
  field: string
): ValidationError | null {
  const stringValue = String(value).trim();

  switch (schema.data_type) {
    case 'boolean':
      // boolean型は allowed_values が 'T|F' と指定されている
      if (stringValue && !['T', 'F'].includes(stringValue)) {
        return {
          row: rowNum,
          column: field,
          value: value,
          message: '真偽値はTまたはFで入力してください',
          type: 'error'
        };
      }
      break;

    case 'number':
      if (isNaN(Number(value))) {
        return {
          row: rowNum,
          column: field,
          value: value,
          message: '数値形式ではありません',
          type: 'error'
        };
      }
      // 許容値チェック（対象種別や種別など）
      if (schema.allowed_values) {
        const allowedValues = schema.allowed_values.split(',').map(v => v.trim());
        if (!allowedValues.includes(String(value))) {
          return {
            row: rowNum,
            column: field,
            value: value,
            message: `許容値の範囲外です (許容値: ${allowedValues.join(', ')})`,
            type: 'error'
          };
        }
      }
      break;

    case 'string':
      if (schema.format) {
        switch (schema.format) {
          case 'YYYY-MM-DD':
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(stringValue)) {
              return {
                row: rowNum,
                column: field,
                value: value,
                message: 'YYYY-MM-DD形式で入力してください',
                type: 'error'
              };
            }
            // 実際の日付として有効かチェック
            const date = new Date(stringValue);
            if (isNaN(date.getTime())) {
              return {
                row: rowNum,
                column: field,
                value: value,
                message: '無効な日付です',
                type: 'error'
              };
            }
            break;

          case 'HH:MM':
            // format指定の正規表現を使用
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(stringValue)) {
              return {
                row: rowNum,
                column: field,
                value: value,
                message: 'HH:MM形式で入力してください',
                type: 'error'
              };
            }
            break;

          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(stringValue)) {
              return {
                row: rowNum,
                column: field,
                value: value,
                message: 'メールアドレスの形式が不正です',
                type: 'error'
              };
            }
            break;

          case 'uri':
            try {
              new URL(stringValue);
            } catch {
              return {
                row: rowNum,
                column: field,
                value: value,
                message: 'URLの形式が不正です',
                type: 'error'
              };
            }
            break;

          case '^[0-9]{7}$': // 郵便番号
            if (!/^\d{7}$/.test(stringValue)) {
              return {
                row: rowNum,
                column: field,
                value: value,
                message: '7桁の数字で入力してください',
                type: 'error'
              };
            }
            break;
        }
      }
      break;

    case 'array[string]':
      if (stringValue) {
        const values = stringValue.split(',').map(v => v.trim());
        
        // formatが指定されている場合（URI等）
        if (schema.format === 'uri') {
          for (const url of values) {
            try {
              new URL(url);
            } catch {
              return {
                row: rowNum,
                column: field,
                value: url,
                message: 'URLの形式が不正です',
                type: 'error'
              };
            }
          }
        }

        // validation_rulesが指定されている場合（タグ系）
        if (schema.validation_rules) {
          const regex = new RegExp(schema.validation_rules);
          const invalidValues = values.filter(v => !regex.test(v));
          if (invalidValues.length > 0) {
            return {
              row: rowNum,
              column: field,
              value: invalidValues.join(', '),
              message: '指定された形式に従っていない値があります',
              type: 'error'
            };
          }
        }
      }
      break;

    default:
      console.warn(`未知のデータ型: ${schema.data_type}`);
  }
  
  return null;
}

function validateDates(data: any[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  
  data.forEach((row, rowIndex) => {
    if (row['OD更新年月日']) {
      const updateDate = new Date(row['OD更新年月日']);
      if (updateDate.getTime() === twoWeeksAgo.getTime()) {
        errors.push({
          row: rowIndex + 1,
          column: 'OD更新年月日',
          value: row['OD更新年月日'],
          message: '更新日が2週間前です',
          type: 'warning'
        });
      }
    }
  });
  
  return errors;
}