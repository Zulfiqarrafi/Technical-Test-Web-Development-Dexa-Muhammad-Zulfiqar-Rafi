import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtUserPayload } from '../constants';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtUserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

