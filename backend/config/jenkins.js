module.exports = {
    url: process.env.JENKINS_URL || 'http://localhost:8080',
    username: process.env.JENKINS_USERNAME || 'admin',
    token: process.env.JENKINS_TOKEN || 'your-api-token',
    timeout: process.env.JENKINS_TIMEOUT || 10000
  };