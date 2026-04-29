import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import connectDB from './db';
import todoRoutes from './routes/todoRoutes';
import authRoutes from './routes/authRoutes';

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

const app = express();
const port = process.env.PORT || 5000;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const allowedOrigins = new Set([clientOrigin, 'http://127.0.0.1:5173', 'http://localhost:5173']);
const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true); // curl/postman
            if (allowedOrigins.has(origin)) return callback(null, true);
            if (localhostRegex.test(origin)) return callback(null, true); // allow any local dev port
            return callback(new Error(`CORS blocked for origin: ${origin}`));
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api', todoRoutes);

connectDB();

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
