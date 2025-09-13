module.exports = {
  apps: [
    {
      name: "archive-system-new",
      script: "pnpm.cmd", // 👈 ganti ke pnpm.cmd
      args: "start",
      interpreter: "none",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
