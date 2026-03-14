import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'library-hackathon-secret-change-in-prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  injectAnomalies: process.env.INJECT_ANOMALIES === 'true',
  nodeEnv: process.env.NODE_ENV || 'development',
};
