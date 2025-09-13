module.exports = {
  apps: [
    {
      name: "archive-system-new",
      script: "cmd",
      args: "/c pnpm start",
      interpreter: "none",
      cwd: __dirname,
      env: {
        PORT: 3000,
        HOST: "0.0.0.0",
        NODE_ENV: "production",
      },
    },
  ],
};
