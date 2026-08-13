export type DatabaseProvider = "azuresql" | "firebase" | "cosmos" | "mariadb";

export interface DatabaseFormState {
  provider: DatabaseProvider;
  azuresql: {
    connectionString: string;
    server: string;
    database: string;
    user: string;
    password: string;
    useManagedIdentity: boolean;
  };
  firebase: {
    serviceAccountPath: string;
    serviceAccountJson: string;
    databaseURL: string;
  };
  cosmos: {
    endpoint: string;
    key: string;
    databaseId: string;
    containerId: string;
  };
  mariadb: {
    connectionString: string;
    host: string;
    port: string;
    database: string;
    user: string;
    password: string;
  };
}

export const defaultDatabaseFormState: DatabaseFormState = {
  provider: "azuresql",
  azuresql: {
    connectionString: "",
    server: "",
    database: "",
    user: "",
    password: "",
    useManagedIdentity: false,
  },
  firebase: {
    serviceAccountPath: "",
    serviceAccountJson: "",
    databaseURL: "",
  },
  cosmos: {
    endpoint: "",
    key: "",
    databaseId: "",
    containerId: "",
  },
  mariadb: {
    connectionString: "",
    host: "",
    port: "",
    database: "",
    user: "",
    password: "",
  },
};

export interface AdminFormValues {
  name: string;
  email: string;
  password: string;
}

export interface SetupResult {
  success: boolean;
  error?: string;
}

export type SetupStep = "database" | "admin" | "complete";