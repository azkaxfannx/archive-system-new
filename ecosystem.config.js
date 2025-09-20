module.exports = {
  apps: [
    {
      name: "archive-system-new",
      cwd: __dirname,
      script: "pnpm.cmd",
      args: "start -H 0.0.0.0 -p 3000",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_EXPIRES: process.env.JWT_EXPIRES,
        AUTH_COOKIE_NAME: process.env.AUTH_COOKIE_NAME,
      },
    },
  ],
};
