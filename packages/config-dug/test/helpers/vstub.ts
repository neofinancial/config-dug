/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import { Mock } from 'vitest';
import { RecursivePartial, Fn, ArgumentTypes } from './common-types';

declare const vi: any;

type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;

export function vstub<T extends {}>(base: RecursivePartial<T> = {}): T & VStub<T> {
  const store = new Map();

  return new Proxy(base, {
    get(target, prop): any {
      if (prop in target) {
        return (target as any)[prop];
      }

      if (prop === 'then') {
        return;
      }

      if (!store.has(prop)) {
        store.set(prop, vi.fn());
      }

      return store.get(prop);
    },
    has(target, prop): boolean {
      if (prop in target) {
        return true;
      }

      if (prop === 'then') {
        return false;
      }

      return true;
    },
  }) as T & VStub<T>;
}

type StubValue<T> = T extends Fn ? Mock<ArgumentTypes<T>, ReturnType<T>> : T;

export type VStub<T> = {
  [P in keyof T]: StubValue<T[P]>;
};
