import express from 'express';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';  // add for serving static files 
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from "./middlewares/auth";

dotenv.config()

const app = express();
const PORT = process.env.PORT || 3000;


const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);


// * middleware to parse JSON & URL-encoded bodies * //
app.use(express.json());
app.use(express.urlencoded( { extended: true }));

// * handle reqs for static files, assuming vite builds to '../../Client/dist' ?  * //
app.use(express.static(path.resolve(import.meta.dirname, '../../client')));  //

// * route handlers * //

interface AuthenticatedRequest extends Request {
  user: { id: string; email?: string };
}

export const requireAuth = (supabaseUrl: string, supabaseServiceKey: string) => {
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  return async (req, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

    const token = authHeader.replace("Bearer ", "");

    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !user) return res.status(401).json({ error: "Unauthorized" });

      req.user = { id: user.id, email: user.email ?? undefined };
      next(); // ✅ continue to the next middleware/route
    } catch (err) {
      res.status(500).json({ error: "Internal server error" });
    }
  };
};

const authMiddleware = requireAuth(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    console.log(data.user)

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
    
        // insert profile into public.users
        const { data: profileData, error: profileError } = await supabaseAdmin.from('users').insert(
        { id: authData.user.id, username, email }).select().single();
        if (profileError) throw profileError;
        res.status(201).json(profileData);
      } catch (err) {
        res.status(500).json({ error: (err as Error).message });
      }
});

// add a friend
app.post('/api/friends', authMiddleware, async (req: Request, res: Response) => {
  const { friend_id, status } = req.body;
  const user_id = req.user?.id;

  if (!user_id) return res.status(401).json({ error: "Unauthorized" });
  if (!friend_id) return res.status(400).json({ error: "Missing friend_id" });

  console.log("User ID:", user_id);
  console.log("Friend ID:", req.body.friend_id);
  try {
    // Check if friend already exists
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('friends')
      .select('*')
      .eq('user_id', user_id)
      .eq('friend_id', friend_id)
      .single();

    if (existing) {
      return res.status(400).json({ error: "Friend already added" });
    }

    // Insert new friend
    const { data, error } = await supabaseAdmin
      .from('friends')
      .insert({ user_id, friend_id, status: status || 'pending' })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error("Add friend error:", err);
    res.status(500).json({ error: (err as Error).message });
  }
});


app.get('/api/getusers', authMiddleware, async (req: Request, res: Response) => {
  const search = req.query.search as string || '';
  const userId = req.user?.id;

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, username, email')
      .ilike('username', `${search}%`)  // case-insensitive match
      .not('id', 'eq', userId);          // exclude current user

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: (err as Error).message });
  }
});


// get friends of a user
app.get('/api/friends/:user_id', async (req: Request, res: Response) => {
  const { user_id } = req.params;

  try {
    const { data, error } = await supabaseAdmin
      .from('friends')
      .select(`
        friend_id,
        status,
        friend:friend_id ( id, username, email )
      `)
      .eq('user_id', user_id);

    if (error) throw error;

    res.json(data.map(item => item.friend));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// create a new group and add creator as admin
app.post('/api/groups', authMiddleware, async (req: Request, res: Response) => {
  const { name } = req.body;  // user is not on req.body 
  try {
    
    const { data: groupData, error: groupError } = await supabaseAdmin.from('groups').insert({
      name, 
      created_by: req.user.id
    }).select().single();
    if (groupError) throw groupError;

    const { error: memberError } = await supabaseAdmin.from('group_members').insert({
      group_id: groupData.id,
      user_id: req.user.id,
      is_admin: true
    });
    if (memberError) throw memberError;
    res.status(201).json(groupData);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message }) 
  }
});


// join a group
app.post('/api/group_members',authMiddleware, async (req: Request, res: Response) => {
  const { group_id, user_id } = req.body;  
  try {
    const { data, error } = await supabaseAdmin.from('group_members').insert({
      group_id,
      user_id: user_id,
      is_admin: false
    }).select().single();
    if (error) throw error;
    res.status(201).json(data)
  } catch(err) { 
    res.status(500).json({ error: (err as Error).message }) 
  }
});

app.get('/api/name/:groupId', async (req, res) => {
  const { groupId } = req.params;

  try {
    const { data, error } = await supabaseAdmin
      .from('groups')
      .select('*') // select all columns including 'name'
      .eq('id', groupId)
      .single(); // return a single object, not an array

    if (error) throw error;

    res.json(data); // { id: "...", name: "Room Name", ... }
  } catch (err) {
    console.error("Error fetching group:", err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// get groups for a user
app.get('/api/groups/:user_id', async (req: Request, res: Response) => {
  const { user_id } = req.params
  try {
    const { data, error } = await supabaseAdmin.from('group_members')
      .select('groups(*)')
      .eq('user_id', user_id);
    if (error) throw error;
    res.json(data.map(item => item.groups))
  } catch (err) {
    res.status(500).json({ error: (err as Error).message }) 
  }
})


// get expenses for a group
app.get('api/expenses/:group_id', async (req: Request, res: Response) => {
  const { group_id } = req.params;
  try {
    const { data , error } = await supabaseAdmin.from('expenses').select('*').eq('group_id', group_id);
    if (error) throw error;
    res.json(data);
  } catch(err) {
    res.status(500).json({ error: (err as Error).message }) 
  }
})




// app.post('api/expense_items', async (req: Request, res: Response) => {
//   const { description, amount } = req.body;

//   try {
//   const { data, error } = await supabaseAdmin.from('expense')
//     .insert({
//       group_id,
//       user_id: req.user.id,
//       amount,
//       description,
//     }) 
//     .select()
//     .single();
//     if(error) throw error;
//     res.status(201).json(data);
// } catch (err) {
//   res.status(500).json({ error: (err as Error).message});
// }
//})

// Handler: Create a new expense with associated items (POST request; calculates total from item amounts)
app.post('/api/groups/:groupId/expenses', async (req: Request, res: Response) => {
  try {
    // Verify user in group and get user ID from auth middleware
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('group_members')
      .select('user_id')
      .eq('group_id', req.params.groupId)
      .eq('user_id', (req.user as any).id);
    if (membershipError || membership.length === 0) throw new Error('User not in group');

    const { description, paid_by, items } = req.body;  // Expect body: { description: string, paid_by: uuid, items: [{description: string, amount: number}] }

    if (!description || !paid_by || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: description, paid_by, or items array' });
    }

    // Calculate total from item amounts
    const total_amount = items.reduce((sum: number, item: { amount: number }) => sum + (item.amount || 0), 0);

    // Insert expense
    const { data: expense, error: expenseError } = await supabaseAdmin
      .from('expenses')
      .insert({
        description,
        amount: total_amount,
        paid_by,
        group_id: req.params.groupId,
        created_at: new Date().toISOString()  // Or rely on DB default
      })
      .select()
      .single();

    if (expenseError) throw expenseError;

    // Insert associated items (batch for efficiency)
    const itemInserts = items.map((item: { description: string, amount: number }) => ({
      expense_id: expense.id,
      description: item.description,
      amount: item.amount,
      created_at: new Date().toISOString()
    }));

    const { data: insertedItems, error: itemsError } = await supabaseAdmin
      .from('expense_items')
      .insert(itemInserts)
      .select();

    if (itemsError) throw itemsError;

    // Return the created expense with nested items
    res.status(201).json({
      ...expense,
      total_amount,
      items: insertedItems
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});



// * error handling for DB queries * //
app.use((err: Error, req: express.Request, res: express.Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'An unexpected error occurred!' });
});


app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`)
}) 