type LogTaskData = [0, 1, 2];

export interface Log {
  date: Date;
  six: {
    nutrition: LogTaskData;
    sleep: LogTaskData;
    sports: LogTaskData;
    relaxation: LogTaskData;
    projects: LogTaskData;
    social_life: LogTaskData;
  };
}
