import { read, utils } from 'xlsx';
import Papa from 'papaparse';
import type { ValidationError, ValidationResult, DataSchema } from '../types/validation';

export async function validateFiles(
  excelFile: File,
  jsonFile: File,
  schemaFile: File
): Promise<ValidationResult> {
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
    formattingErrors: validateExcelFormatting(excelData),
    schemaErrors: validateAgainstSchema(excelData, schema),
    dateErrors: validateDates(excelData),
    totalErrors: 0
  };

  result.totalErrors = 
    result.formattingErrors.length + 
    result.schemaErrors.length + 
    result.dateErrors.length;
  
  result.isValid = result.totalErrors === 0 && result.recordCountMatch;

  return result;
}

async function readExcelFile(file: File): Promise<any[]> {
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);
  const workbook = read(data, { type: 'array', cellStyles: true });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  return utils.sheet_to_json(worksheet, { header: 1 });
}

function validateExcelFormatting(data: any[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // 各セルの書式チェック
  data.forEach((row, rowIndex) => {
    Object.entries(row).forEach(([colIndex, cell]) => {
      if (typeof cell === 'object' && cell !== null) {
        // 取り消し線チェック
        if ((cell as any).s?.strike) {
          errors.push({
            row: rowIndex + 1,
            column: `${String.fromCharCode(65 + parseInt(colIndex))}`,
            value: cell,
            message: '取り消し線が使用されています',
            type: 'error'
          });
        }
        
        // 背景色チェック
        if ((cell as any).s?.fgColor) {
          errors.push({
            row: rowIndex + 1,
            column: `${String.fromCharCode(65 + parseInt(colIndex))}`,
            value: cell,
            message: '背景色が設定されています',
            type: 'error'
          });
        }
      }
    });
  });
  
  return errors;
}

function validateAgainstSchema(data: any[], schema: DataSchema[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  data.forEach((row, rowIndex) => {
    schema.forEach(schemaField => {
      const value = row[schemaField.field_path];
      
      // 必須チェック
      if (schemaField.required && (value === undefined || value === null || value === '')) {
        errors.push({
          row: rowIndex + 1,
          column: schemaField.field_path,
          value: value,
          message: '必須項目が入力されていません',
          type: 'error'
        });
        return;
      }
      
      // データ型チェック
      if (value !== undefined && value !== null) {
        switch (schemaField.data_type.toLowerCase()) {
          case 'number':
            if (isNaN(Number(value))) {
              errors.push({
                row: rowIndex + 1,
                column: schemaField.field_path,
                value: value,
                message: '数値形式ではありません',
                type: 'error'
              });
            }
            break;
            
          case 'date':
            if (isNaN(Date.parse(value))) {
              errors.push({
                row: rowIndex + 1,
                column: schemaField.field_path,
                value: value,
                message: '日付形式ではありません',
                type: 'error'
              });
            }
            break;
        }

        // 許容値チェック
        if (schemaField.allowed_values) {
          const allowedValues = schemaField.allowed_values.split(',').map(v => v.trim());
          if (!allowedValues.includes(String(value))) {
            errors.push({
              row: rowIndex + 1,
              column: schemaField.field_path,
              value: value,
              message: '許容値の範囲外です',
              type: 'error'
            });
          }
        }

        // バリデーションルールチェック
        if (schemaField.validation_rules) {
          try {
            const rules = JSON.parse(schemaField.validation_rules);
            if (rules.maxLength && String(value).length > rules.maxLength) {
              errors.push({
                row: rowIndex + 1,
                column: schemaField.field_path,
                value: value,
                message: `最大文字数(${rules.maxLength})を超えています`,
                type: 'error'
              });
            }
            if (rules.pattern) {
              const regex = new RegExp(rules.pattern);
              if (!regex.test(String(value))) {
                errors.push({
                  row: rowIndex + 1,
                  column: schemaField.field_path,
                  value: value,
                  message: 'フォーマットが不正です',
                  type: 'error'
                });
              }
            }
          } catch (e) {
            console.error('バリデーションルールの解析に失敗:', e);
          }
        }
      }
    });
  });
  
  return errors;
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
