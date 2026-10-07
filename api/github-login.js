export default function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  
  if (!clientId) {
    return res.status(500).send("GITHUB_CLIENT_ID is not configured on the server.");
  }
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}`;
  
  res.redirect(githubAuthUrl);
}
