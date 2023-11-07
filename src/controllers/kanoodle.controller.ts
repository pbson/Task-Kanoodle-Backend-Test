import { Controller, Body, Post, HttpCode, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Container } from 'typedi';
// import { GetKanoodleSolutionDto } from '@/dtos/kanoodle.dto';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { KanoodleService } from '@services/kanoodle.service';

@Controller()
export class KanoodleController {
  public path = '/users';
  public kanoodleService = Container.get(KanoodleService);

  @Post('/kanoodle')
  @HttpCode(201)
  @OpenAPI({ summary: 'Find solutions for Kanoodle prolem' })
  // @UseBefore(ValidationMiddleware(GetKanoodleSolutionDto))
  async solveKanoodleProblem(@Body() input) {
    const kanoodleSolutions = await this.kanoodleService.solveKanoodleProblem(input);
    return { data: kanoodleSolutions, message: 'kanoodle problem solved!' };
  }
}
