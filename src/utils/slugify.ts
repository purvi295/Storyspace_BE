// src/utils/slugify.ts
// Utility functions for generating URL-friendly slugs

/**
 * Converts a string to a URL-friendly slug
 * @param text - The text to convert to a slug
 * @returns A lowercase, hyphen-separated slug
 * @example
 * slugify("My First Story!") // returns "my-first-story"
 */
export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
};

/**
 * Generates a unique slug by appending a random suffix
 * @param baseSlug - The base slug to make unique
 * @param suffix - Optional suffix to append (defaults to random 8-char string)
 * @returns A unique slug
 * @example
 * generateUniqueSlug("my-first-story") // returns "my-first-story-a8f1b2c3"
 */
export const generateUniqueSlug = (baseSlug: string, suffix?: string): string => {
  const randomSuffix = suffix || Math.random().toString(36).substring(2, 10);
  return `${baseSlug}-${randomSuffix}`;
};