const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userSchema');
require('dotenv').config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
},
async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
            return done(null, user);
        } else {
            const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
            if (!email) {
                return done(new Error("Email not provided by Google"), null);
            }

            // Check if user already exists with this email
            let existingUser = await User.findOne({ email: email });
            if (existingUser) {
                // Link googleId to existing account
                existingUser.googleId = profile.id;
                await existingUser.save();
                return done(null, existingUser);
            }

            const newUser = new User({
                name: profile.displayName,
                email: email,
                googleId: profile.id
            });
            await newUser.save();
            return done(null, newUser);
        }
    } catch (error) {
        console.error("Error in Google Strategy:", error);
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id)
        .then(user => {
            done(null, user);
        })
        .catch(err => {
            console.error("Error in deserializeUser:", err);
            done(err, null);
        });
});

module.exports = passport;
