export enum Sesame2Status {
  Locked = 'locked',
  Unlocked = 'unlocked',
  Moved = 'moved'
}

export type Sesame2StatusResponse = {
  batteryPercentage: number;
  batteryVoltage: number;
  position: number;
  CHSesame2Status: Sesame2Status;
  timestamp: number;
};

export type Sesame2History = {
  type: number;
  timeStamp: number;
  historyTag: string;
  devicePk: string;
  recordID: number;
  parameter: unknown;
};

export type Sesame2HistoryResponse = Sesame2History[];

export enum Sesame2Cmd {
  Toggle = 88,
  Lock = 82,
  Unlock = 83
}

export type Sesame2CmdRequest = {
  cmd: Sesame2Cmd;
  history: string;
  sign: string;
};
