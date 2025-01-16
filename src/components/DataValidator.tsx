import { useState, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Typography,
  Button,
  Spinner,
} from "@material-tailwind/react";
import { FileUpload } from './FileUpload';
import { ValidationResults } from './ValidationResults';
import type { FileState, FileType } from '../types/files';
import type { ValidationResult } from '../types/validation';
import { validateFiles } from '../utils/validation';

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
      console.error('Validation error:', error);
      alert('バリデーション中にエラーが発生しました');
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
              '実行'
            )}
          </Button>
        </CardFooter>
      </Card>

      {validationResult && <ValidationResults result={validationResult} />}
    </div>
  );
}

