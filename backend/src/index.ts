import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './db';
import todoRoutes from './routes/todoRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api', todoRoutes);

connectDB();

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
