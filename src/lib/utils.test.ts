import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn (classnames utility)', () => {
  it('should merge basic classes correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('should handle conditional classes', () => {
    expect(cn('class1', true && 'class2', false && 'class3')).toBe('class1 class2');
  });

  it('should handle arrays of classes', () => {
    expect(cn(['class1', 'class2'])).toBe('class1 class2');
  });

  it('should handle objects with boolean values', () => {
    expect(cn({ class1: true, class2: false, class3: true })).toBe('class1 class3');
  });

  it('should resolve tailwind class conflicts correctly (twMerge)', () => {
    // p-3 should override px-2 py-1
    expect(cn('px-2 py-1', 'p-3')).toBe('p-3');

    // text-red-500 should override text-blue-500
    expect(cn('text-blue-500', 'text-red-500')).toBe('text-red-500');
  });

  it('should handle falsy values (undefined, null, false, 0, "")', () => {
    expect(cn('class1', undefined, null, false, 0, '')).toBe('class1');
  });

  it('should handle complex mixed inputs', () => {
    expect(
      cn(
        'base-class',
        true && 'active',
        false && 'inactive',
        ['arr-1', 'arr-2'],
        { 'obj-1': true, 'obj-2': false },
        'p-4',
        'p-2' // Should override p-4
      )
    ).toBe('base-class active arr-1 arr-2 obj-1 p-2');
  });
});
