import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { TTSubtask, FileUploadResult, REQUIRED_CSV_COLUMNS, CSVColumnMapping } from './types';
import { generateId } from './utils';

/**
 * Validates if the CSV/XLSX file has all required columns
 */
export function validateCSVColumns(headers: string[]): { isValid: boolean; missingColumns: string[] } {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim().replace(/\s+/g, '_'));
  const requiredColumns = REQUIRED_CSV_COLUMNS.map(col => col.toLowerCase());
  
  const missingColumns: string[] = [];
  
  for (const requiredCol of requiredColumns) {
    if (!normalizedHeaders.includes(requiredCol)) {
      missingColumns.push(requiredCol);
    }
  }
  
  return {
    isValid: missingColumns.length === 0,
    missingColumns
  };
}

/**
 * Creates column mapping based on headers
 */
export function createColumnMapping(headers: string[]): CSVColumnMapping | null {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim().replace(/\s+/g, '_'));
  
  const mapping: Partial<CSVColumnMapping> = {};
  
  REQUIRED_CSV_COLUMNS.forEach(column => {
    const index = normalizedHeaders.indexOf(column.toLowerCase());
    if (index !== -1) {
      mapping[column] = index;
    }
  });
  
  // Check if we have all required columns
  if (Object.keys(mapping).length === REQUIRED_CSV_COLUMNS.length) {
    return mapping as CSVColumnMapping;
  }
  
  return null;
}

/**
 * Processes a single row of CSV data into a TTSubtask
 */
export function processCSVRow(
  row: string[], 
  mapping: CSVColumnMapping, 
  rowIndex: number
): TTSubtask | null {
  try {
    const getValue = (columnKey: keyof CSVColumnMapping): string => {
      const columnIndex = mapping[columnKey];
      const value = row[columnIndex];
      
      // Handle empty or undefined values
      if (value === undefined || value === null || value === '' || value.toLowerCase() === 'n/a') {
        return 'N/A';
      }
      
      return value.toString().trim();
    };

    const subtask: TTSubtask = {
      id: generateId(),
      category: getValue('category'),
      regulation: getValue('regulation'),
      scenario: getValue('scenario'),
      lighting: getValue('lighting'),
      street_lights: getValue('street_lights'),
      beam: getValue('beam'),
      overlap: getValue('overlap'),
      target_speed: getValue('target_speed'),
      ego_speed: getValue('ego_speed'),
      number_of_runs: getValue('number_of_runs'),
      headway: getValue('headway'),
      brake: getValue('brake'),
      priority: getValue('priority'),
      status: 'pending',
      executedRuns: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      lastEditedBy: undefined // Will be set when task is created
    };

    return subtask;
  } catch (error) {
    console.error(`Error processing row ${rowIndex}:`, error);
    return null;
  }
}

/**
 * Processes CSV file content
 */
export function processCSVContent(content: string, fileName: string): FileUploadResult {
  try {
    const parseResult = Papa.parse(content, {
      skipEmptyLines: true,
      transform: (value) => value.trim()
    });

    if (parseResult.errors && parseResult.errors.length > 0) {
      return {
        success: false,
        error: `CSV parsing errors: ${parseResult.errors.map(e => e.message).join(', ')}`
      };
    }

    const rows = parseResult.data as string[][];
    
    if (rows.length < 2) {
      return {
        success: false,
        error: 'CSV file must contain at least a header row and one data row'
      };
    }

    // Extract headers and validate
    const headers = rows[0];
    const validation = validateCSVColumns(headers);
    
    if (!validation.isValid) {
      return {
        success: false,
        error: `Missing required columns: ${validation.missingColumns.join(', ')}`
      };
    }

    // Create column mapping
    const mapping = createColumnMapping(headers);
    if (!mapping) {
      return {
        success: false,
        error: 'Failed to create column mapping'
      };
    }

    // Process data rows
    const subtasks: TTSubtask[] = [];
    const errors: string[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      // Skip completely empty rows
      if (row.every(cell => !cell || cell.trim() === '')) {
        continue;
      }

      const subtask = processCSVRow(row, mapping, i + 1);
      if (subtask) {
        subtasks.push(subtask);
      } else {
        errors.push(`Failed to process row ${i + 1}`);
      }
    }

    if (subtasks.length === 0) {
      return {
        success: false,
        error: 'No valid subtasks found in CSV file'
      };
    }

    return {
      success: true,
      data: subtasks,
      fileName,
      totalRows: subtasks.length
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to process CSV: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Processes XLSX file content
 */
export function processXLSXContent(buffer: ArrayBuffer, fileName: string): FileUploadResult {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    // Get the first worksheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return {
        success: false,
        error: 'No worksheets found in XLSX file'
      };
    }

    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to CSV format
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    
    // Process as CSV
    return processCSVContent(csvContent, fileName);

  } catch (error) {
    return {
      success: false,
      error: `Failed to process XLSX: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Main function to process uploaded file
 */
export async function processUploadedFile(file: File): Promise<FileUploadResult> {
  const fileName = file.name;
  const fileExtension = fileName.split('.').pop()?.toLowerCase();

  if (!fileExtension || !['csv', 'xlsx', 'xls'].includes(fileExtension)) {
    return {
      success: false,
      error: 'Unsupported file format. Please upload CSV or XLSX files only.'
    };
  }

  try {
    if (fileExtension === 'csv') {
      const content = await file.text();
      return processCSVContent(content, fileName);
    } else {
      const buffer = await file.arrayBuffer();
      return processXLSXContent(buffer, fileName);
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Utility function to generate sample CSV content for testing
 */
export function generateSampleCSV(): string {
  const headers = REQUIRED_CSV_COLUMNS.join(',');
  const sampleRows = [
    'A1,REG001,Scenario1,daylight,on,high,50,60,80,5,2.5,hard,high',
    'A2,REG002,Scenario2,night,off,low,40,50,100,3,1.5,medium,medium',
    'B1,REG003,Scenario3,dusk,on,medium,N/A,70,120,4,,soft,low'
  ];
  
  return [headers, ...sampleRows].join('\n');
} 