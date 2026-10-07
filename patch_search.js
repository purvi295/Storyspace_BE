const fs = require('fs');
const repoPath = '/var/www/html/Node-js/Learning/src/repositories/story.repository.ts';
let code = fs.readFileSync(repoPath, 'utf8');

const oldSearch = `    if (options.searchQuery) {
      const keyword = \`%\${options.searchQuery.toLowerCase()}%\`;
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where("LOWER(story.title) LIKE :keyword", { keyword })
            .orWhere("LOWER(story.content) LIKE :keyword", { keyword })
            .orWhere("LOWER(story.summary) LIKE :keyword", { keyword });
        })
      );
    }`;

const newSearch = `    if (options.searchQuery) {
      const words = options.searchQuery.toLowerCase().split(/\\s+/).filter(w => w.length > 2);
      if (words.length > 0) {
        queryBuilder.andWhere(
          new Brackets((qb) => {
            words.forEach((word, index) => {
              const paramName = \`keyword_\${index}\`;
              const paramValue = \`%\${word}%\`;
              if (index === 0) {
                qb.where(
                  \`(LOWER(story.title) LIKE :\${paramName} OR LOWER(story.content) LIKE :\${paramName} OR LOWER(story.summary) LIKE :\${paramName})\`,
                  { [paramName]: paramValue }
                );
              } else {
                qb.andWhere(
                  \`(LOWER(story.title) LIKE :\${paramName} OR LOWER(story.content) LIKE :\${paramName} OR LOWER(story.summary) LIKE :\${paramName})\`,
                  { [paramName]: paramValue }
                );
              }
            });
          })
        );
      }
    }`;

if(code.includes('options.searchQuery.toLowerCase()')) {
    code = code.replace(oldSearch, newSearch);
    fs.writeFileSync(repoPath, code);
    console.log("Updated search logic");
} else {
    console.log("Could not find old search logic");
}
