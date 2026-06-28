export type TFileExtension = string;
export type TFileName = string;
export type TFilePath = string;
export type TDirectoryPath = string;
export type TPath = TFilePath | TDirectoryPath;
export interface ISymlink { from: TPath; to: TPath; }
