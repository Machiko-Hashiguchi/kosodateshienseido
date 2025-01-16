import { useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Alert,
  Typography,
  Button,
  Tooltip,
} from "@material-tailwind/react";
import { Download } from "lucide-react";
import type { ValidationResult } from '../types/validation';
import { generateValidationCsv } from '../utils/fileUtils';

interface Props {
  result: ValidationResult;
}

export function ValidationResults({ result }: Props) {
  const defaultProps = {
    placeholder: "",
    onPointerEnterCapture: () => {},
    onPointerLeaveCapture: () => {},
  };

  const totalErrors = useMemo(() => {
    return result.schemaErrors.length + result.dateErrors.length;
  }, [result]);

  const handleDownload = () => {
    try {
      // エラーとデータの準備
      const allErrors = [
        ...result.schemaErrors.map(error => ({
          ...error,
          errorType: 'スキーマエラー'  // エラー種別を追加
        })),
        ...result.dateErrors.map(error => ({
          ...error,
          errorType: '日付エラー'    // エラー種別を追加
        }))
      ];
      
      if (allErrors.length === 0) {
        alert('エラーがないため、出力するデータがありません。');
        return;
      }
  
      // CSVの生成
      const csv = generateValidationCsv(allErrors, result.excelData);
  
      // BOMを追加してShift-JISエンコーディングを設定
      const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
      const blob = new Blob([bom, csv], { 
        type: 'text/csv;charset=utf-8' 
      });
  
      // ダウンロード処理
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `validation_results_${timestamp}.csv`;
  
      // クリックイベントの発火
      document.body.appendChild(a);
      a.click();
      
      // クリーンアップ
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
  
      console.log('CSV download completed:', {
        errorCount: allErrors.length,
        timestamp,
        fileName: `validation_results_${timestamp}.csv`
      });
    } catch (error) {
      console.error('CSV download failed:', error);
      alert('CSVファイルの出力中にエラーが発生しました。');
    }
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
              {result.isValid ? '成功' : `エラーあり`}
            </span>
          </Typography>
        </div>
      </CardHeader>

      <CardBody {...defaultProps} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Alert
            color={result.recordCountMatch ? "green" : "red"}
            variant="outlined"
            className="flex items-center"
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
                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-sm">
                  不一致
                </span>
              )}
            </Typography>
          </Alert>

          {result.schemaErrors.length > 0 && (
            <Alert
              color="red"
              variant="outlined"
              className="flex items-center justify-between"
            >
              <Typography
                {...defaultProps}
                color="inherit"
                className="flex items-center gap-2"
              >
                <span className="font-medium">スキーマ検証エラー:</span>
                <span>{result.schemaErrors.length}件</span>
              </Typography>
              <Tooltip content="エラー内容をCSVでダウンロード">
                <Button
                  {...defaultProps}
                  variant="text"
                  size="sm"
                  color="red"
                  className="flex items-center gap-2"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4" />
                  CSV出力
                </Button>
              </Tooltip>
            </Alert>
          )}
        </div>

        {result.isValid && (
          <Alert
            color="green"
            variant="outlined"
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


