module.exports = {
  apps: [
    {
      name: "archive-system-new",
      script: "start.js",
      cwd: __dirname,
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
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
