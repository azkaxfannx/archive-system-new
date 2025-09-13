module.exports = {
  apps: [
    {
      name: "archive-system-new",
      script: "cmd",
      args: "/c pnpm start",
      interpreter: "none",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
