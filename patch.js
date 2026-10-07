const fs = require('fs');
const repoPath = '/var/www/html/Node-js/Learning/src/repositories/story.repository.ts';
let code = fs.readFileSync(repoPath, 'utf8');

// Add searchQuery to the interface
code = code.replace(
  'currentUserUuid?: string;',
  'currentUserUuid?: string;\n    searchQuery?: string;'
);

// Add the ILIKE condition before getting the count
const searchLogic = `
    if (options.searchQuery) {
      const keyword = \`%\${options.searchQuery.toLowerCase()}%\`;
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where("LOWER(story.title) LIKE :keyword", { keyword })
            .orWhere("LOWER(story.content) LIKE :keyword", { keyword })
            .orWhere("LOWER(story.summary) LIKE :keyword", { keyword });
        })
      );
    }

    const total = await queryBuilder.getCount();`;

code = code.replace('const total = await queryBuilder.getCount();', searchLogic);
fs.writeFileSync(repoPath, code);
