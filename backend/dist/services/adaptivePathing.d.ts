import { IGapDetail } from '../models/GapReport';
import { IPathwayStep } from '../models/Pathway';
export declare function generatePathway(gapDetail: IGapDetail, candidateSkills: string[]): Promise<{
    steps: IPathwayStep[];
    totalEstimatedHours: number;
}>;
//# sourceMappingURL=adaptivePathing.d.ts.map