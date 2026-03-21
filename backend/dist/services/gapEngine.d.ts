import { IGapDetail } from '../models/GapReport';
import { IParsedData } from '../models/Resume';
import { IJob } from '../models/Job';
export declare function extractSkillsFromParsedData(data: IParsedData): string[];
export declare function computeGap(candidateNormalizedSkills: string[], job: IJob): Promise<IGapDetail>;
//# sourceMappingURL=gapEngine.d.ts.map