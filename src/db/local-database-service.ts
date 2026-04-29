import { AzureSqlDatabaseService } from "./azuresql-database-service";
import type { AzureSqlConfig } from "@/lib/types";

// Local SQL provider that uses the same schema/queries as Azure SQL.
export class LocalDatabaseService extends AzureSqlDatabaseService {
  constructor(config: AzureSqlConfig) {
    super(config);
  }
}

export default LocalDatabaseService;
