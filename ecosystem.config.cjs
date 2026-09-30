module.exports = {
  apps: [
    {
      name: "blockchainclub",
      script: "node_modules/vite/bin/vite.js",
      args: "--host 0.0.0.0 --port 5179",
      cwd: "/home/ubuntu/Workspace/BlockchainClub-FUTMinna",
      env: {
        NODE_OPTIONS: "--max-old-space-size=4096",
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      max_memory_restart: "1G",
      log_file: "/tmp/pm2-blockchainclub.log",
      error_file: "/tmp/pm2-blockchainclub-error.log",
      time: true,
    },
  ],
};
