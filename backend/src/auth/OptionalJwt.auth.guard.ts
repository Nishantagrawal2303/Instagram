import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    // If error or token is missing, do not throw 401; return null so public endpoints can serve guest users
    if (err || !user) {
      return null;
    }
    return user;
  }
}
