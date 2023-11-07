import { Service } from 'typedi';
import { Kanoodle } from '@/algorithm/kanoodle.class';
import { PieceDescriptions } from '@/algorithm/pieces.const';

@Service()
export class KanoodleService {
  public async solveKanoodleProblem(initialPieces) {
    const Gridwith = 11;
    const Gridheight = 5;

    const solutions = Kanoodle.findAllSolutions(PieceDescriptions, Gridwith, Gridheight, initialPieces);
    return {
      count: solutions.length,
      solutions,
    };
  }
}
