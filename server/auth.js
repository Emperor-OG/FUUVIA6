const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./db');  // import your existing Pool instance from db.js
require('dotenv').config();

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: process.env.callbackURL,
  passReqToCallback: true,
},
  async (request, accessToken, refreshToken, profile, done) => {
    try {
      const googleId = profile.id.toString();
      const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
      const displayName = profile.displayName || null;

      // Try find user by google_id
      let userResult = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);

      if (userResult.rows.length > 0) {
        return done(null, userResult.rows[0]);
      }

      // Try find user by email (optional)
      userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

      if (userResult.rows.length > 0) {
        // Update google_id for existing user
        await pool.query('UPDATE users SET google_id = $1 WHERE email = $2', [googleId, email]);
        const updatedUserResult = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
        return done(null, updatedUserResult.rows[0]);
      }

      // Insert new user if none found
      const insertResult = await pool.query(
        'INSERT INTO users (google_id, email, username) VALUES ($1, $2, $3) RETURNING *',
        [googleId, email, displayName]
      );

      return done(null, insertResult.rows[0]);

    } catch (error) {
      return done(error, null);
    }
  }
));

// Serialize user by google_id
passport.serializeUser((user, done) => {
  done(null, user.google_id);
});

// Deserialize user by google_id
passport.deserializeUser(async (google_id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE google_id = $1', [google_id]);
    if (result.rows.length === 0) return done(null, false);
    done(null, result.rows[0]);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;