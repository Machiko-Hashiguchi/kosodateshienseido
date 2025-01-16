export interface SchemaField {
  field_path: string;
  data_type: string;
  required: string;
  description: string;
  validation_type?: string;
  validation_rule?: string;
  min_length?: string;
  max_length?: string;
  allowed_values?: string;
  format?: string;
}