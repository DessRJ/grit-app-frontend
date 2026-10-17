import { Challenge } from '../../../core/challenges.data';

export interface RunnerResult {
  data?: Record<string, unknown>;
  evidenceIds?: string[];
}

export type RunnerHost = {
  ch: Challenge;
};
