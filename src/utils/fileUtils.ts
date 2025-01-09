import Encoding from 'encoding-japanese';
import Papa, { ParseConfig, ParseResult } from 'papaparse';

export const readShiftJISFile = async (file: File): Promise<string> => {
  try {
    const buffer = await file.arrayBuffer();
    const sjisArray = new Uint8Array(buffer);
    
    // エンコーディングの自動検出
    const detectedEncoding = Encoding.detect(sjisArray);
    
    // Shift-JISからUnicodeへ変換
    const unicodeArray = Encoding.convert(sjisArray, {
      from: detectedEncoding || 'SJIS',
      to: 'UNICODE',
      type: 'array'
    });
    
    return Encoding.codeToString(unicodeArray);
  } catch (error) {
    console.error('File reading error:', error);
    throw new Error('ファイルの読み込み中にエラーが発生しました');
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
		  resolve(results.data);
		},
    };  
	  Papa.parse(csvString, config);
	});
  };