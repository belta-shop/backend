import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";

const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URL } =
  process.env;

if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !GITHUB_REDIRECT_URL) {
  throw new Error(
    "GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET or GITHUB_REDIRECT_URL is required"
  );
}

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user: any, done) {
  done(null, user);
});

passport.use(
  new GitHubStrategy(
    {
      clientID: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackURL: GITHUB_REDIRECT_URL,
    },
    async function (
      _accessToken: string,
      _refreshToken: string,
      profile: any,
      done: any
    ) {
      const providerId = profile.id;
      const fullName = profile.displayName;
      done(null, {
        providerId,
        fullName,
        provider: "github",
        role: "client",
        confirmed: true,
      });
    }
  )
);
