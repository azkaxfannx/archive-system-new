module.exports = {
  apps: [
    {
      name: "archive-system-new",
      script: "./node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: __dirname,
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      // kill_timeout: 5000, // Wait 5s for graceful shutdown
      shutdown_with_message: true,
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
