import { App } from '@/app';
import { KanoodleController } from '@controllers/kanoodle.controller';
import { ValidateEnv } from '@utils/validateEnv';

ValidateEnv();

const app = new App([KanoodleController]);
app.listen();
