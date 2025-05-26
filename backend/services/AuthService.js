const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserSession = require('../models/UserSession');

class AuthService {
  constructor() {
    this.googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    this.jwtSecret = process.env.JWT_SECRET || 'your-default-secret-key';
    this.sessionDuration = 24; // hours
  }

  // Verify Google OAuth token
  async verifyGoogleToken(token) {
    try {
      console.log('🔐 Verifying Google token...');
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      
      const payload = ticket.getPayload();
      console.log('✅ Google token verified for user:', payload.email);
      console.log('🔍 Google payload debug:', {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        email_verified: payload.email_verified
      });
      
      return {
        google_id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        email_verified: payload.email_verified
      };
    } catch (error) {
      console.error('❌ Google token verification failed:', error);
      throw new Error('Invalid Google token');
    }
  }

  // Login or register user with Google
  async loginWithGoogle(googleToken) {
    try {
      console.log('🚀 Starting Google OAuth login process...');
      
      // Verify Google token
      const googleProfile = await this.verifyGoogleToken(googleToken);
      
      if (!googleProfile.email_verified) {
        throw new Error('Email not verified with Google');
      }

      // Find or create user
      let user = await User.findByGoogleId(googleProfile.google_id);
      
      if (!user) {
        console.log('👤 Creating new user for:', googleProfile.email);
        user = await User.createFromGoogle(googleProfile);
      } else {
        console.log('👤 Existing user found:', googleProfile.email);
        // Update last login and profile if needed
        await user.updateLastLogin();
        
        // Update profile picture if it changed
        if (user.picture_url !== googleProfile.picture) {
          await user.updateProfile({ picture_url: googleProfile.picture });
        }
      }

      // Create new session
      console.log('🎫 Creating user session...');
      const session = await UserSession.create(user.id, this.sessionDuration);

      // Create JWT token with session reference
      const jwtPayload = {
        user_id: user.id,
        session_id: session.id,
        email: user.email,
        name: user.name
      };

      const jwtToken = jwt.sign(jwtPayload, this.jwtSecret, { 
        expiresIn: `${this.sessionDuration}h` 
      });

      console.log('✅ Google OAuth login successful for:', user.email);

      return {
        token: jwtToken,
        user: user.toJSON(),
        session: session.toJSON()
      };
    } catch (error) {
      console.error('❌ Google OAuth login failed:', error);
      throw error;
    }
  }

  // Verify JWT token and session
  async verifyToken(token) {
    try {
      // Verify JWT
      const decoded = jwt.verify(token, this.jwtSecret);
      console.log('🔍 JWT decoded successfully:', { 
        user_id: decoded.user_id, 
        session_id: decoded.session_id,
        email: decoded.email 
      });
      
      // Check if session is still valid using session_id from JWT
      const session = await UserSession.findById(decoded.session_id);
      console.log('🔍 Session lookup result:', session ? 'Found' : 'Not found');
      
      if (!session || !session.isValid()) {
        console.log('❌ Session validation failed:', {
          sessionExists: !!session,
          sessionValid: session ? session.isValid() : false,
          sessionData: session ? session.toJSON() : null
        });
        throw new Error('Session expired or invalid');
      }

      // Get user
      const user = await User.findById(decoded.user_id);
      if (!user) {
        throw new Error('User not found');
      }

      // Extend session if it's close to expiring (less than 2 hours left)
      const hoursUntilExpiry = (new Date(session.expires_at) - new Date()) / (1000 * 60 * 60);
      if (hoursUntilExpiry < 2) {
        await session.extend(this.sessionDuration);
      }

      return {
        user: user.toJSON(),
        session: session.toJSON(),
        decoded
      };
    } catch (error) {
      console.error('Token verification failed:', error);
      throw error;
    }
  }

  // Logout user (invalidate session)
  async logout(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      const session = await UserSession.findById(decoded.session_id);
      
      if (session) {
        await session.invalidate();
        console.log('🚪 User logged out:', decoded.email);
      }
      
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      // Don't throw error for logout - just log it
      return false;
    }
  }

  // Logout from all devices
  async logoutAll(userId) {
    try {
      await UserSession.invalidateAllForUser(userId);
      console.log('🚪 User logged out from all devices:', userId);
      return true;
    } catch (error) {
      console.error('Logout all error:', error);
      throw error;
    }
  }

  // Get user sessions
  async getUserSessions(userId) {
    try {
      return await UserSession.findActiveByUserId(userId);
    } catch (error) {
      console.error('Error getting user sessions:', error);
      throw error;
    }
  }

  // Refresh token (extend session)
  async refreshToken(token) {
    try {
      const verification = await this.verifyToken(token);
      
      // Create new JWT with extended expiration
      const jwtPayload = {
        user_id: verification.user.id,
        session_id: verification.session.id,
        email: verification.user.email,
        name: verification.user.name
      };

      const newJwtToken = jwt.sign(jwtPayload, this.jwtSecret, { 
        expiresIn: `${this.sessionDuration}h` 
      });

      return {
        token: newJwtToken,
        user: verification.user,
        session: verification.session
      };
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  // Cleanup expired sessions (maintenance function)
  async cleanupExpiredSessions() {
    try {
      return await UserSession.cleanupExpired();
    } catch (error) {
      console.error('Session cleanup failed:', error);
      throw error;
    }
  }

  // Middleware for protecting routes
  authenticateToken() {
    return async (req, res, next) => {
      try {
        // For preflight OPTIONS requests, just return OK
        if (req.method === 'OPTIONS') {
          return res.status(200).end();
        }

        // Get token from Authorization header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
          return res.status(401).json({ error: 'Authentication required' });
        }

        // Verify token and session
        const verification = await this.verifyToken(token);
        
        // Add user and session to request
        req.user = verification.user;
        req.session = verification.session;
        req.decoded = verification.decoded;
        
        next();
      } catch (error) {
        console.error('Authentication middleware error:', error);
        return res.status(403).json({ 
          error: 'Invalid or expired token',
          details: error.message 
        });
      }
    };
  }
}

module.exports = new AuthService(); 