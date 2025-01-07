import {
  Card,
  CardHeader,
  CardBody,
  Alert,
  Typography,
} from "@material-tailwind/react";
import type { ValidationResult, ValidationError } from '../types/validation';

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
        return "red";
    }
  };

  const defaultTypographyProps = {
    placeholder: "",
    onPointerEnterCapture: () => {},
    onPointerLeaveCapture: () => {},
  };


  return (
    <div>
      <Typography 
        {...defaultTypographyProps}
        variant="h5"
        color={getAlertColor(type)}
      >
        {title} ({errors.length}件)
      </Typography>
      <div>
        {errors.map((error, index) => (
          <Alert 
            key={index} 
            color={getAlertColor(type)}
            variant="filled"
          >
            <Typography
              {...defaultTypographyProps}
              color="inherit"
            >
              行{error.row}, 列{error.column}: {error.message}
            </Typography>
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

  return (
    <Card
      {...defaultProps}
      shadow={false}
    >
      <CardHeader 
        {...defaultProps}
        floated={false}
        variant="gradient"
        color={result.isValid ? "green" : "red"}
        shadow={false}
      >
        <Typography 
          {...defaultProps}
          variant="h4"
          color="white"
        >
          バリデーション結果: {result.isValid ? '成功' : 'エラーあり'}
        </Typography>
      </CardHeader>

      <CardBody {...defaultProps}>
        <Alert
          color={result.recordCountMatch ? "green" : "red"}
          variant="filled"
        >
          <Typography
            {...defaultProps}
            color="inherit"
          >
            レコード数: Excel({result.excelRecordCount}) / JSON({result.jsonRecordCount})
            {!result.recordCountMatch && (
              <Typography 
                {...defaultProps}
                variant="small"
                color="red"
              >
                <span> - 不一致</span>
              </Typography>
            )}
          </Typography>
        </Alert>

        {result.formattingErrors.length > 0 && (
          <ErrorList
            title="Excel形式エラー"
            errors={result.formattingErrors}
            type="error"
          />
        )}

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
          >
            <Typography
              {...defaultProps}
              color="inherit"
            >
              すべてのチェックに合格しました。
            </Typography>
          </Alert>
        )}
      </CardBody>
    </Card>
  );
}