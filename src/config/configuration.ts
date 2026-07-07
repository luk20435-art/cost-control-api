export interface AppConfig {
  port: number;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  admin: {
    username: string;
    password?: string;
    passwordHash?: string;
  };
  cors: {
    origin: string;
  };
  cookie: {
    secure: boolean;
  };
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  },
  admin: {
    username: process.env.ADMIN_USERNAME ?? 'admin',
    password: process.env.ADMIN_PASSWORD,
    passwordHash: process.env.ADMIN_PASSWORD_HASH,
  },
  cors: {
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
  },
  cookie: {
    secure: process.env.COOKIE_SECURE === 'true',
  },
});
