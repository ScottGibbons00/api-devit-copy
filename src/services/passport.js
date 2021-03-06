import passport from 'passport';
import LocalStrategy from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import dotenv from 'dotenv';

import User from '../models/user';

// loads in .env file if needed
dotenv.config({ silent: true });

// options for local strategy, we'll use email AS the username
// not have separate ones
const localOptions = { usernameField: 'email' };

// options for jwt strategy
// we'll pass in the jwt in an `authorization` header
// so passport can find it there
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromHeader('authorization'),
  secretOrKey: process.env.AUTH_SECRET,
};
// NOTE: we are not calling this a bearer token (although it technically is), if you see people use Bearer in front of token on the internet you could either ignore it, use it but then you have to parse it out here as well as prepend it on the frontend.


// username/email + password authentication strategy
const localLogin = new LocalStrategy(localOptions, async (email, password, done) => {
  let user;
  let match;

  try {
    user = await User.findOne({ email });
    if (!user) {
      return done(null, false); // if user doesn't exists, return/break with no error
    }
    match = await user.comparePassword(password);
    if (!match) {
      return done(null, false); // if password does not match, return/break with no error
    } else {
      return done(null, user); // if password matches, return with user and no error
    }
  } catch (error) {
    return done(error); // if error, pass error
  }
});

const jwtLogin = new JwtStrategy(jwtOptions, async (payload, done) => {
  let user;
  try {
    user = await User.findById(payload.sub);
  } catch (error) {
    done(error, false); // if error finding user, pass error
  }
  if (user) {
    done(null, user); // if user exists, return user
  } else {
    done(null, false); // if no user by that id exists, return/break with no error
  }
});

// Tell passport to use this strategy
passport.use(jwtLogin); // for 'jwt'
passport.use(localLogin); // for 'local'

// middleware functions to use in routes
export const requireAuth = passport.authenticate('jwt', { session: false });
export const requireSignin = passport.authenticate('local', { session: false });
