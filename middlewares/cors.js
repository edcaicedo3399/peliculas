import cors from 'cors'

const ACCEPTED_ORIGINS = [
  'https://peliculas-4v49.onrender.com',
  'http://localhost:8080',
  'http://localhost:1234',
  'https://movies.com',
  'https://midu.dev',
  'http://localhost:63342'
];

export const corsMiddleware = ({ acceptedOrigins = ACCEPTED_ORIGINS } = {}) => cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (acceptedOrigins.includes(origin)) {
      return callback(null, true)
    }

    if (!origin) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  }
})
