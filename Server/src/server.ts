import express from 'express';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
// import apiRouter from ;
import path from 'path';  // add for serving static files 
import { createClient } from '@supabase/supabase-js';

dotenv.config()

const app = express();
const PORT = process.env.PORT || 3000;

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// * middleware to parse JSON & URL-encoded bodies * //
app.use(express.json());
app.use(express.urlencoded( { extended: true }));

// * handle reqs for static files, assuming vite builds to '../../Client/dist' ?  * //
app.use(express.static(path.resolve(import.meta.dirname, '../../client')));  //


// * error handling for DB queries * //
app.use((err: Error, req: express.Request, res: express.Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'An unexpected error occurred!' });
});

// * route handlers * //

// fetch a user by ID 
app.get('/api/users/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabaseAdmin.from('users').select('*').eq('id', id).single();
        if (error) throw error;
        if (!data) {
          return res.status(404).json({ error: 'User not found' });
        }
        res.json(data);
      } catch (err) {
        res.status(500).json({ error: (err as Error).message });
      }
});

app.post("/api/users/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (error) return res.status(401).json({ error: error.message });

    res.status(200).json({
      user: data.user,
      session: data.session
    });

  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// create a new user *** how to integrate with supabase auth for secure user creation??? 
app.post('/api/users', async (req: Request, res: Response) => {
    // @ts-ignore
    const { username, password, email } = req.body;
    console.log(username, password, email)
    try {  // create user in auth.user via admin
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            user_metadata: { username },
            email_confirm: true
        });
        if (authError) throw authError;
    
        // insert profile into public.users (this assumes trigger isn't set!!! need to set up triggers on supabase for automation)
        const { data: profileData, error: profileError } = await supabaseAdmin.from('users').insert(
        { id: authData.user.id, username, email }).select().single();
        if (profileError) throw profileError;
        res.status(201).json(profileData);
      } catch (err) {
        res.status(500).json({ error: (err as Error).message });
      }
});

// add a friend
app.post('/api/friends', async (req: Request, res: Response) => {
  const { user_id, friend_id, status } = req.body;
  try {
    const { data, error } = await supabaseAdmin.from('friends').insert({
      user_id,
      friend_id,
      status
    }).select().single();
    if (error) throw error;
    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})


// get friends of a user
app.get('/api/friends/:user_id', async (req: Request, res: Response) => {
  const { user_id } = req.params;
  try {
    const { data, error } = await supabaseAdmin.from('friends')
      .select('users!friends_friend_id_fkey(*)')
      .eq('user_id', user_id);
      if (error) throw error;
      res.json(data.map(item => item.users));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})


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