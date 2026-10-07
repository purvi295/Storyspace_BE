const fs = require('fs');
const path = '/var/www/html/Node-js/Learning/src/routes/internal.routes.ts';
let code = fs.readFileSync(path, 'utf8');

const oldCall = `      const { stories, total } = await storyRepository.findAllWithFilters({
        skip,
        take: limitNum,
        currentUserUuid: viewerId, // undefined = treat as guest (public only)
      });

      // Filter by keyword in title/content/summary
      const keyword = q.toLowerCase();
      const filtered = stories.filter(
        (s) =>
          s.title.toLowerCase().includes(keyword) ||
          s.content.toLowerCase().includes(keyword) ||
          (s.summary && s.summary.toLowerCase().includes(keyword)),
      );`;

const newCall = `      // Let the database handle pagination AND keyword searching correctly
      const { stories: filtered, total } = await storyRepository.findAllWithFilters({
        skip,
        take: limitNum,
        currentUserUuid: viewerId,
        searchQuery: q,
      });`;

code = code.replace(oldCall, newCall);
fs.writeFileSync(path, code);
