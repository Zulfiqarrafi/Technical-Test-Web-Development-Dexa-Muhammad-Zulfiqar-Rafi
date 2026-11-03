import { ColumnType } from 'typeorm';

export function dateTimeColumnType(): ColumnType {
  const dbType = (process.env.DB_TYPE || 'mysql').toLowerCase();
  if (dbType === 'postgres' || dbType === 'oracle') {
    return 'timestamp';
  }
  return 'datetime';
}

