import { IParsedData } from '../models/Resume';
export interface ParseResumeResponse {
    status: string;
    data: IParsedData;
}
export declare function parseResumeFromBuffer(buffer: Buffer, filename: string, mimetype: string): Promise<IParsedData>;
//# sourceMappingURL=resumeParser.d.ts.map