module.exports = {
  apps: [
    {
      name: "archive-system-new", // nama app di PM2
      script: "pnpm", // jalankan perintah "pnpm"
      args: "start", // dengan argumen "start"
      interpreter: "none", // jangan pakai node interpreter
      cwd: __dirname, // path kerja = folder project ini
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
