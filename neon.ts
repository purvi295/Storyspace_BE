import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  buckets: {
    story: { access: "public_read" },
  },
});
