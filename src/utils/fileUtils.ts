import Encoding from 'encoding-japanese';
import Papa, { ParseConfig, ParseResult } from 'papaparse';
import iconv from 'iconv-lite';
import { ValidationError } from '@/types/validation';

export const readShiftJISFile = async (file: File): Promise<string> => {
	try {
	  console.log('File reading started:', file.name);
	  const buffer = await file.arrayBuffer();
	  const sjisArray = new Uint8Array(buffer);
	  
	  // エンコーディングの検出結果を確認
	  const detectedEncoding = Encoding.detect(sjisArray);
	  console.log('Detected encoding:', detectedEncoding);
	  
	  const unicodeArray = Encoding.convert(sjisArray, {
		from: detectedEncoding || 'SJIS',
		to: 'UNICODE',
		type: 'array'
	  });
	  
	  const result = Encoding.codeToString(unicodeArray);
	  console.log('Converted content (first 100 chars):', result.substring(0, 100));
	  return result;
	} catch (error) {
	  console.error('File reading error:', error);
	  throw error;
	}
  };

interface CSVRow {
  [key: string]: string;
}

export const parseCSV = (csvString: string): Promise<CSVRow[]> => {
	return new Promise((resolve, reject) => {
	  const config: ParseConfig = {
		header: true,
		skipEmptyLines: true,
		complete: (results: ParseResult<CSVRow>) => {
			console.log('CSV parsing results:', {
				headers: results.meta.fields,
				rowCount: results.data.length,
				sampleRow: results.data[0]
			  });
		  resolve(results.data);
		},
		
    };  
	  Papa.parse(csvString, config);
	});
  };

export const generateValidationCsv = (errors: ValidationError[], excelData: any[]): string => {
  const csvData = errors.map(error => {
    const rowData = excelData[error.row - 1];  // error.rowは1から始まるため、-1する
    return {
      行番号: error.row,
      psid: rowData.psid || '',
      自治体名: rowData['対象地域.対象地域'] || '',
      通称: rowData['名称.通称'] || '',
      エラー項目名: error.field,
      エラー内容: error.message
    };
  });

  return Papa.unparse(csvData, {
    header: true
  });
};