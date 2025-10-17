export enum FSType {
  FILE,
  DIRECTORY,
}

export interface FSNode {
  name: string;
  type: FSType;
  children?: FSNode[];
  content?: string;
  creationTime?: Date;
  size?: number;
  attributes?: {
    readOnly: boolean;
  };
  vDiskInfo?: {
    isAttached: boolean;
    driveLetter: string | null;
  }
}
