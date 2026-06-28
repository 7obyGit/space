export type TFileExtension = string;
export type TFileName = string;
export type TFilePath = string;
export type TDirectoryPath = string;
export type TPath = TFilePath | TDirectoryPath;
export interface TSymlink { from: TPath; to: TPath; }
