module.exports = {
  apps: [
    {
      name: "bot-score",
      cwd: "/root/trackers/bot-score",
      script: "npm",
      args: "start",
      autorestart: true,
      max_restarts: 50,
      restart_delay: 5000,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
}
