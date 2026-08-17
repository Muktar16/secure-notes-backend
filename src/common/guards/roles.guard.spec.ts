import { ForbiddenException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

function contextFor(user: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

function guardRequiring(roles: string[] | undefined) {
  const reflector = { getAllAndOverride: () => roles } as unknown as Reflector;
  return new RolesGuard(reflector);
}

describe('RolesGuard', () => {
  it('allows a route that declares no roles', () => {
    expect(guardRequiring(undefined).canActivate(contextFor({ role: 'user' })))
      .toBe(true);
  });

  it('allows a matching role', () => {
    expect(guardRequiring(['admin']).canActivate(contextFor({ role: 'admin' })))
      .toBe(true);
  });

  it('allows any of several accepted roles', () => {
    const guard = guardRequiring(['user', 'admin']);
    expect(guard.canActivate(contextFor({ role: 'user' }))).toBe(true);
    expect(guard.canActivate(contextFor({ role: 'admin' }))).toBe(true);
  });

  it('rejects a non-matching role', () => {
    expect(() =>
      guardRequiring(['admin']).canActivate(contextFor({ role: 'user' })),
    ).toThrow(ForbiddenException);
  });

  it('rejects when no user was attached to the request', () => {
    expect(() =>
      guardRequiring(['admin']).canActivate(contextFor(undefined)),
    ).toThrow(ForbiddenException);
  });

  it('cannot be fooled by a role-shaped string on an unauthenticated request', () => {
    expect(() =>
      guardRequiring(['admin']).canActivate(contextFor('admin')),
    ).toThrow(ForbiddenException);
  });
});
