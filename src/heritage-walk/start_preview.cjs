const { preview } = require("vite");
(async () => {
  const server = await preview({
    root: "F:/cx/src/heritage-walk",
    preview: { port: 5199, host: "0.0.0.0", strictPort: true }
  });
  server.printUrls();
  // 保持进程存活
  process.stdin.resume();
})();
