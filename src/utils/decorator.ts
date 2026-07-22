import { Param, ParseUUIDPipe } from '@nestjs/common';

export const IdParam = (param: string = 'id') => Param(param, ParseUUIDPipe);
