module.exports = {
  apps: [
    {
      name: "archive-system-new",
      script: "pnpm",
      args: "start -- -H 0.0.0.0 -p 3000",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
