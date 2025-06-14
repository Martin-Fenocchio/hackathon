import { Controller, Post, Body } from '@nestjs/common';
import { SolverService } from './solver.service';
import { SolveTextDto } from './dto/solve-text.dto';
import { TextSolverResult } from './interfaces/solver-result.interface';

@Controller('solver')
export class SolverController {
  constructor(private readonly solverService: SolverService) {}

  @Post('solve')
  async solveText(@Body() solveTextDto: SolveTextDto): Promise<TextSolverResult> {
    return this.solverService.solveText(solveTextDto);
  }
}
