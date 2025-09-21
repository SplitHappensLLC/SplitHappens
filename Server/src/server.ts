import express from 'express';
import dotenv from 'dotenv';
// import apiRouter from ;
import { Pool } from 'pg';
import path from 'path';  // add for serving static files 

const app = express();
const PORT = process.env.PORT || 3000;

// * set up postreSQL connection pool using pg (for supabase db) * //
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // necessary for supabase connect
  });

//pool.connect()

// * middleware to parse JSON & URL-encoded bodies * //
app.use(express.json());
app.use(express.urlencoded( { extended: true }));

// * handle reqs for static files, assuming vite builds to '../../Client/dist' ?  * //
app.use(express.static(path.resolve(import.meta.dirname, '../../client')));  //


// * error handling for DB queries * //
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'An unexpected error occurred!' });
});


// * route handlers * //

// fetch a user by ID 
app.get('/api/users/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]); // $1 is placeholder in sql, way to refer to dynamic data in query. placeholders are numbered from $1 for first param, $2 for second, etc. 
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found'});
        }
        res.json(result.rows[0]);
    } catch(err) {
        res.status(500).json({ error: (err as Error).message });
    }
});


// create a new user *** how to integrate with supabase auth for secure user creation??? 



// add a friend



// get friends of a user



// create a new group and add creator as admin



// join a group


// get groups for a user



// create an expense, split (equally?) among group members, and update splits/balances



// get expenses for a group



// get balances for a user (aggregated)
// app.get("/balances", async (req: Request, res: Response) => {
//     const fromUserId = req.param.from_user;
//     const toUserId = req.param.to_user;

//     if (typeof req !== String) {

//     }
//     try {
    
//         SELECT amount 
//         FROM balances
//         WHERE from_user = fromUserId AND to_user = toUserId;


//     }
// } )


app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`)
}) 