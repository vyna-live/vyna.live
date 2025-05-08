/**
 * Chart Generator Service
 * Analyzes data and generates appropriate chart configurations
 */

interface ChartData {
  headers: string[];
  rows: any[][];
  type?: 'numerical' | 'categorical' | 'time-series';
}

interface ChartConfig {
  type: 'chart';
  chartType: 'bar' | 'line' | 'pie' | 'area';
  data: any[];
  xKey: string;
  yKeys: string[];
  colors?: string[];
  width?: number;
  height?: number;
}

/**
 * Extract chart-ready data from a markdown table
 */
export function extractChartData(tableMarkdown: string): ChartData | null {
  try {
    const lines = tableMarkdown.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 3) {
      return null; // Need at least headers, separator, and one data row
    }
    
    // Extract headers
    const headerLine = lines[0];
    const headers = headerLine
      .split('|')
      .filter(cell => cell.trim() !== '')
      .map(cell => cell.trim());
    
    // Skip the separator line (line[1])
    
    // Extract data rows
    const dataRows = lines.slice(2).map(line => 
      line
        .split('|')
        .filter(cell => cell.trim() !== '')
        .map(cell => {
          const trimmed = cell.trim();
          // Try to convert to number if possible
          const num = parseFloat(trimmed);
          return isNaN(num) ? trimmed : num;
        })
    );
    
    // Determine data type
    let type: 'numerical' | 'categorical' | 'time-series' = 'categorical';
    
    // Check if first column might be dates
    const possibleDateColumn = dataRows.map(row => row[0]);
    const datePattern = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$|^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/;
    const isTimeSeriesData = possibleDateColumn.every(
      val => typeof val === 'string' && datePattern.test(val)
    );
    
    if (isTimeSeriesData) {
      type = 'time-series';
    } else {
      // Check if other columns are mostly numeric
      const numericColumns = headers.map((_, colIndex) => 
        dataRows.every(row => typeof row[colIndex] === 'number')
      );
      
      // If we have at least one numeric column (besides the first), consider it numerical data
      if (numericColumns.slice(1).some(isNumeric => isNumeric)) {
        type = 'numerical';
      }
    }
    
    return {
      headers,
      rows: dataRows,
      type
    };
    
  } catch (error) {
    console.error('Error extracting chart data from table:', error);
    return null;
  }
}

/**
 * Generate appropriate chart configuration based on data characteristics
 */
export function generateChart(chartData: ChartData): ChartConfig | null {
  try {
    const { headers, rows, type } = chartData;
    
    if (headers.length < 2 || rows.length < 1) {
      return null; // Need at least two columns and one row
    }
    
    // Prepare the data in the format required for charts
    const data = rows.map(row => {
      const dataPoint: any = {};
      headers.forEach((header, index) => {
        dataPoint[header] = row[index];
      });
      return dataPoint;
    });
    
    // Determine best chart type based on data characteristics
    let chartType: 'bar' | 'line' | 'pie' | 'area';
    let xKey = headers[0];
    const yKeys = headers.slice(1).filter((_, index) => 
      rows.some(row => typeof row[index + 1] === 'number')
    );
    
    if (type === 'time-series') {
      chartType = 'line';
    } else if (type === 'numerical') {
      if (rows.length <= 5) {
        chartType = 'bar';
      } else {
        chartType = 'line';
      }
      
      // If there's only one numeric column and few categories, consider a pie chart
      if (yKeys.length === 1 && rows.length <= 8) {
        // Check if values are proportional (good for pie charts)
        const sum = rows.reduce((acc, row) => acc + (typeof row[1] === 'number' ? row[1] : 0), 0);
        const valuesAreProbablyPercentages = sum >= 95 && sum <= 105;
        
        if (valuesAreProbablyPercentages || rows.length <= 5) {
          chartType = 'pie';
        }
      }
    } else {
      // Categorical data
      if (yKeys.length === 0) {
        // No numeric columns found, can't generate a chart
        return null;
      }
      
      if (rows.length <= 10) {
        chartType = 'bar';
      } else {
        chartType = 'line';
      }
    }
    
    // Generate colorful palette
    const colors = [
      '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c',
      '#d0ed57', '#83a6ed', '#8dd1e1', '#a4506c', '#6a5ec9'
    ];
    
    return {
      type: 'chart',
      chartType,
      data,
      xKey,
      yKeys,
      colors,
      width: 600,
      height: 400
    };
    
  } catch (error) {
    console.error('Error generating chart config:', error);
    return null;
  }
}

/**
 * Analyze text to find patterns that might be good for visualization
 */
export function analyzeTextForVisualizationPatterns(text: string): {
  hasPercentages: boolean;
  hasComparisons: boolean;
  hasTimeData: boolean;
  hasTrends: boolean;
} {
  // Look for percentage patterns
  const percentagePattern = /\d+%|\d+\s+percent/gi;
  const percentageMatches = text.match(percentagePattern) || [];
  
  // Look for comparison indicators
  const comparisonPattern = /more than|less than|higher|lower|increase|decrease|compared to/gi;
  const comparisonMatches = text.match(comparisonPattern) || [];
  
  // Look for time-related patterns
  const timePattern = /(?:in|by|since|from|during)\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|january|february|march|april|may|june|july|august|september|october|november|december|q[1-4]/gi;
  const timeMatches = text.match(timePattern) || [];
  
  // Look for trend indicators
  const trendPattern = /trend|growth|decline|rise|fall|grew|rising|falling|upward|downward/gi;
  const trendMatches = text.match(trendPattern) || [];
  
  return {
    hasPercentages: percentageMatches.length >= 3,
    hasComparisons: comparisonMatches.length >= 2,
    hasTimeData: timeMatches.length >= 3,
    hasTrends: trendMatches.length >= 2
  };
}

/**
 * Determine if a table contains data suitable for visualization
 */
export function isTableVisualizationWorthy(tableData: ChartData): boolean {
  const { headers, rows, type } = tableData;
  
  // Tables with too many columns or rows might not visualize well
  if (headers.length > 10 || rows.length > 20) {
    return false;
  }
  
  // Need at least one numeric column for visualization
  const hasNumericColumn = headers.some((_, colIndex) => 
    rows.some(row => typeof row[colIndex] === 'number')
  );
  
  if (!hasNumericColumn) {
    return false;
  }
  
  // Check if the data varies enough to be interesting as a visualization
  if (type === 'numerical' || type === 'time-series') {
    // Find numeric columns
    const numericColumnIndices = headers.map((_, colIndex) => 
      rows.some(row => typeof row[colIndex] === 'number') ? colIndex : -1
    ).filter(index => index !== -1);
    
    // For each numeric column, check if there's enough variation
    return numericColumnIndices.some(colIndex => {
      const values = rows.map(row => 
        typeof row[colIndex] === 'number' ? row[colIndex] : 0
      );
      
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      // If all values are the same, not worthy of visualization
      if (min === max) {
        return false;
      }
      
      // If there's significant variation, visualization might be helpful
      return (max - min) / max > 0.1; // At least 10% variation
    });
  }
  
  return true;
}