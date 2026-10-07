const fs = require('fs');
const path = '/var/www/html/Node-js/Learning/src/repositories/story.repository.ts';
let code = fs.readFileSync(path, 'utf8');

const searchLogicStr = `    if (options.searchQuery) {
      const words = options.searchQuery.toLowerCase().split(/\\s+/).filter(w => w.length > 2);
      if (words.length > 0) {
        queryBuilder.andWhere(
          new Brackets((qb) => {
            words.forEach((word, index) => {
              const paramName = \\\`keyword_\\\${index}\\\`;
              const paramValue = \\\`%\\\${word}%\\\`;
              if (index === 0) {
                qb.where(
                  \\\`(LOWER(story.title) LIKE :\\\${paramName} OR LOWER(story.content) LIKE :\\\${paramName} OR LOWER(story.summary) LIKE :\\\${paramName})\\\`,
                  { [paramName]: paramValue }
                );
              } else {
                qb.andWhere(
                  \\\`(LOWER(story.title) LIKE :\\\${paramName} OR LOWER(story.content) LIKE :\\\${paramName} OR LOWER(story.summary) LIKE :\\\${paramName})\\\`,
                  { [paramName]: paramValue }
                );
              }
            });
          })
        );
      }
    }

    const total = await queryBuilder.getCount();`;

// 1. Revert findPublicPublishedStories (first instance)
// But to be safe, let's just do string replacement carefully
const parts = code.split('const total = await queryBuilder.getCount();');

// We have 3 occurrences in the original code, but now we have 1 modified, and 2 original.
// Actually, let's just use regex to find where to put it in findAllWithFilters

// Revert the first block
code = code.replace(searchLogicStr.replace(/\\/g, ''), '    const total = await queryBuilder.getCount();');

// Add it to findAllWithFilters
// findAllWithFilters has this block at the end:
const targetBlock = `    if (options.author) {
      queryBuilder.andWhere("story.user_uuid = :author", {
        author: options.author,
      });
    }

    const total = await queryBuilder.getCount();`;

const replacementBlock = `    if (options.author) {
      queryBuilder.andWhere("story.user_uuid = :author", {
        author: options.author,
      });
    }

${searchLogicStr.replace(/\\/g, '')}`;

code = code.replace(targetBlock, replacementBlock);
fs.writeFileSync(path, code);
