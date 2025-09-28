import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/auth/user.model";
import UserProvider from "../models/auth/user-provider.model";

const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = process.env;

if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
  throw new Error("GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are required");
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
      callbackURL: "http://localhost:5006/auth/github/callback",
    },
    async function (
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: any
    ) {
      let userId = null;
      try {
        const providerId = profile.id;
        let userProvider = await UserProvider.findOne({ providerId });
        let user = null;
        if (!userProvider) {
          const fullName = profile.displayName;
          const email = profile.emails?.[0]?.value;
          const provider = "github";
          const role = "client";
          const confirmed = true;
          user = await User.create({
            providerId,
            fullName,
            email,
            provider,
            role,
            confirmed,
          });
          userId = user._id;
          await UserProvider.create({
            providerId,
            user: user._id,
            provider,
          });
        } else {
          user = await User.findById(userProvider.user);
        }
        return done(null, user);
      } catch (error) {
        if (userId) {
          await User.findByIdAndDelete(userId);
        }
        return done(error, null);
      }
    }
  )
);
