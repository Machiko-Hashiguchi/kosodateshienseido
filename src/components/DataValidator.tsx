// components/DataValidator.tsx
import { useState, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Typography,
  Button,
  Spinner,
  Alert,
} from "@material-tailwind/react";
import { FileUpload } from './FileUpload';
import { ValidationResults } from './ValidationResults';
import type { FileState, FileType } from '../types/files';
import type { ValidationResult, ValidationError } from '../types/validation';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const baseProps = {
  placeholder: "",
  onPointerEnterCapture: () => {},
  onPointerLeaveCapture: () => {},
};

export function DataValidator() {
  const [files, setFiles] = useState<FileState>({
    excel: null,
    json: null,
    schema: null,
  });
  const [errors, setErrors] = useState<Partial<Record<FileType, string>>>({});
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = useCallback((type: FileType, event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFiles(prev => ({ ...prev, [type]: event.target.files![0] }));
      setErrors(prev => ({ ...prev, [type]: undefined }));
    }
  }, []);

  const readExcelFile = async (file: File): Promise<any[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, {
      type: 'array',
      cellDates: true,
      cellNF: true,
    });
    const firstSheet = workbook.SheetNames[0];
    return XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
  };

  const readJsonFile = async (file: File): Promise<any[]> => {
    const text = await file.text();
    return JSON.parse(text);
  };

  const readSchemaFile = async (file: File): Promise<any[]> => {
    const text = await file.text();
    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (error: Error) => reject(error)
      });
    });
  };

  const validateFiles = async (excel: File, json: File, schema: File): Promise<ValidationResult> => {
    try {
      const [excelData, jsonData, schemaData] = await Promise.all([
        readExcelFile(excel),
        readJsonFile(json),
        readSchemaFile(schema),
      ]);

      const formattingErrors: ValidationError[] = [];
      const schemaErrors: ValidationError[] = [];
      const dateErrors: ValidationError[] = [];

      const recordCountMatch = excelData.length === jsonData.length;
      const schemaFields = schemaData[0] ? Object.keys(schemaData[0]) : [];
      
      excelData.forEach((row, rowIndex) => {
        Object.entries(row).forEach(([key, value]) => {
          if (!schemaFields.includes(key)) {
            schemaErrors.push({
              row: rowIndex + 1,
              column: key,
              message: '未定義のフィールドです',
              value,
              type: typeof value
            });
          }

          const schemaField = schemaData.find(s => s.field === key);
          if (schemaField?.type === 'date' && value && !(value instanceof Date)) {
            dateErrors.push({
              row: rowIndex + 1,
              column: key,
              message: '日付形式が不正です',
              value,
              type: 'date'
            });
          }

          if (schemaField?.required === 'true' && !value) {
            formattingErrors.push({
              row: rowIndex + 1,
              column: key,
              message: '必須項目が未入力です',
              value,
              type: schemaField.type
            });
          }
        });
      });

      const totalErrors = formattingErrors.length + schemaErrors.length + dateErrors.length;

      return {
        isValid: totalErrors === 0 && recordCountMatch,
        recordCountMatch,
        excelRecordCount: excelData.length,
        jsonRecordCount: jsonData.length,
        formattingErrors,
        schemaErrors,
        dateErrors,
        totalErrors,
      };
    } catch (error) {
      throw new Error('バリデーション処理中にエラーが発生しました');
    }
  };

  const handleValidate = async () => {
    if (!files.excel || !files.json || !files.schema) {
      setErrors({
        excel: !files.excel ? 'ファイルを選択してください' : undefined,
        json: !files.json ? 'ファイルを選択してください' : undefined,
        schema: !files.schema ? 'ファイルを選択してください' : undefined,
      });
      return;
    }

    setLoading(true);
    try {
      const result = await validateFiles(files.excel, files.json, files.schema);
      setValidationResult(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
      setErrors({
        excel: errorMessage,
        json: errorMessage,
        schema: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card {...baseProps} className="mb-8">
        <CardHeader {...baseProps} color="blue" className="p-6">
          <Typography {...baseProps} variant="h5" color="white">
            データ品質チェッカー
          </Typography>
        </CardHeader>
        <CardBody {...baseProps} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { type: 'excel' as const, label: 'Excelファイル', accept: '.xlsx' },
              { type: 'json' as const, label: 'JSONファイル', accept: '.json' },
              { type: 'schema' as const, label: 'スキーマファイル', accept: '.csv' },
            ].map(({ type, label, accept }) => (
              <FileUpload
                key={type}
                label={label}
                accept={accept}
                onChange={(e) => handleFileChange(type, e)}
                file={files[type]}
                error={errors[type]}
              />
            ))}
          </div>
        </CardBody>
        <CardFooter {...baseProps} className="pt-0">
          <Button
            {...baseProps}
            size="lg"
            color="blue"
            fullWidth
            className="mt-6"
            onClick={handleValidate}
            disabled={loading || !files.excel || !files.json || !files.schema}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Spinner {...baseProps} className="h-4 w-4" />
                チェック中...
              </div>
            ) : (
              'バリデーション実行'
            )}
          </Button>
        </CardFooter>
      </Card>

      {validationResult && (
        <Alert {...baseProps} color={validationResult.isValid ? "green" : "red"}>
          バリデーション結果: {validationResult.isValid ? '成功' : 'エラーあり'}
        </Alert>
      )}

      {validationResult && <ValidationResults result={validationResult} />}
    </div>
  );
}

export default DataValidator;