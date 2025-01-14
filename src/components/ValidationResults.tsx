import {
  Card,
  CardHeader,
  CardBody,
  Alert,
  Typography,
  Button,
  Tooltip
} from "@material-tailwind/react";
import { Download } from "lucide-react";
import type { ValidationResult, ValidationError } from '../types/validation';
import { generateValidationCsv } from '../utils/fileUtils';
import { useMemo } from 'react';

interface ErrorListProps {
  title: string;
  errors: ValidationError[];
  type?: "error" | "warning" | "success";
}

function ErrorList({ title, errors, type = "error" }: ErrorListProps) {
  const getAlertColor = (type: string): "red" | "amber" | "green" => {
    switch (type) {
      case "error":
        return "red";
      case "warning":
        return "amber";
      case "success":
        return "green";
      default:
        return "green";
    }
  };

  const defaultTypographyProps = {
    placeholder: "",
    onPointerEnterCapture: () => {},
    onPointerLeaveCapture: () => {},
  };

  return (
    <div className="mt-4">
      <Typography 
        {...defaultTypographyProps}
        variant="h5"
        color={getAlertColor(type)}
        className="mb-2"
      >
        {title} ({errors.length}件)
      </Typography>
      <div className="space-y-2">
        {errors.map((error, index) => (
          <Alert 
            key={`${error.row}-${error.column}-${index}`}
            color={getAlertColor(type)}
            variant="filled"
            className="flex items-center"
          >
            <div className="flex-1">
              <Typography
                {...defaultTypographyProps}
                color="inherit"
                className="font-medium"
              >
                行 {error.row}
              </Typography>
              <Typography
                {...defaultTypographyProps}
                variant="small"
                color="inherit"
                className="mt-1 opacity-80"
              >
                項目: {error.column}
              </Typography>
              <Typography
                {...defaultTypographyProps}
                color="inherit"
                className="mt-1"
              >
                {error.message}
              </Typography>
            </div>
          </Alert>
        ))}
      </div>
    </div>
  );
}

interface ValidationResultsProps {
  result: ValidationResult;
}

export function ValidationResults({ result }: ValidationResultsProps) {
  const defaultProps = {
    placeholder: "",
    onPointerEnterCapture: () => {},
    onPointerLeaveCapture: () => {},
  };

  const totalErrors = useMemo(() => {
    return result.schemaErrors.length + 
           result.dateErrors.length;
  }, [result]);

  const handleDownload = () => {
    const allErrors = [
      ...result.schemaErrors,
      ...result.dateErrors
    ];
    
    if (allErrors.length === 0) {
      alert('エラーがないため、出力するデータがありません。');
      return;
    }

    const csv = generateValidationCsv(allErrors, result.excelData);
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { 
      type: 'text/csv;charset=utf-8' 
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation_results_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card {...defaultProps} shadow={false} className="mb-8">
      <CardHeader 
        {...defaultProps}
        floated={false}
        variant="gradient"
        color={result.isValid ? "green" : "red"}
        shadow={false}
        className="p-6"
      >
        <div className="flex items-center justify-between">
          <Typography 
            {...defaultProps}
            variant="h6"
            color="white"
            className="flex items-center gap-2"
          >
            バリデーション結果
            <span className="px-2 py-1 text-sm bg-white/20 rounded">
              {result.isValid ? '成功' : `${totalErrors}件のエラー`}
            </span>
          </Typography>
          {totalErrors > 0 && (
            <Tooltip content="エラー内容をCSVでダウンロード">
              <Button
                {...defaultProps}
                variant="filled"
                size="sm"
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
                CSV出力
              </Button>
            </Tooltip>
          )}
        </div>
      </CardHeader>

      <CardBody {...defaultProps} className="p-6">
        <Alert
          color={result.recordCountMatch ? "green" : "red"}
          variant="filled"
          className="mb-4"
        >
          <Typography
            {...defaultProps}
            color="inherit"
            className="flex items-center gap-2"
          >
            <span className="font-medium">レコード数検証:</span>
            <span>
              Excel ({result.excelRecordCount}) / JSON ({result.jsonRecordCount})
            </span>
            {!result.recordCountMatch && (
              <span className="bg-white/20 px-2 py-0.5 rounded text-sm">
                不一致
              </span>
            )}
          </Typography>
        </Alert>

        {result.schemaErrors.length > 0 && (
          <ErrorList
            title="スキーマ検証エラー"
            errors={result.schemaErrors}
            type="error"
          />
        )}

        {result.dateErrors.length > 0 && (
          <ErrorList
            title="日付検証エラー"
            errors={result.dateErrors}
            type="warning"
          />
        )}

        {result.isValid && (
          <Alert
            color="green"
            variant="filled"
            className="mt-4"
          >
            <Typography
              {...defaultProps}
              color="inherit"
              className="font-medium"
            >
              すべてのチェックに合格しました
            </Typography>
          </Alert>
        )}
      </CardBody>
    </Card>
  );
}