import express from "express";
import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import path from "path"; // add for serving static files
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "./middlewares/auth";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// * middleware to parse JSON & URL-encoded bodies * //
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// * handle reqs for static files, assuming vite builds to '../../Client/dist' ?  * //
app.use(express.static(path.resolve(import.meta.dirname, "../../client"))); //

// * route handlers * //

interface AuthenticatedRequest extends Request {
  user: { id: string; email?: string };
}

export const requireAuth = (
  supabaseUrl: string,
  supabaseServiceKey: string
) => {
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  return async (req, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

    const token = authHeader.replace("Bearer ", "");

    try {
      const {
        data: { user },
        error
      } = await supabaseAdmin.auth.getUser(token);
      if (error || !user)
        return res.status(401).json({ error: "Unauthorized" });

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
app.get("/api/users/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: "User not found" });
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
    console.log(data.user);

    res.status(200).json({
      user: data.user,
      session: data.session
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// create a new user *** how to integrate with supabase auth for secure user creation???
app.post("/api/users", async (req: Request, res: Response) => {
  // @ts-ignore
  const { username, password, email } = req.body;
  console.log(username, password, email);
  try {
    // create user in auth.user via admin
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: { username },
        email_confirm: true
      });
    if (authError) throw authError;

    // insert profile into public.users
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("users")
      .insert({ id: authData.user.id, username, email })
      .select()
      .single();
    if (profileError) throw profileError;
    res.status(201).json(profileData);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// add a friend
app.post(
  "/api/friends",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { friend_id, status } = req.body;
    const user_id = req.user?.id;

    if (!user_id) return res.status(401).json({ error: "Unauthorized" });
    if (!friend_id) return res.status(400).json({ error: "Missing friend_id" });

    console.log("User ID:", user_id);
    console.log("Friend ID:", req.body.friend_id);
    try {
      // Check if friend already exists
      const { data: existing, error: checkError } = await supabaseAdmin
        .from("friends")
        .select("*")
        .eq("user_id", user_id)
        .eq("friend_id", friend_id)
        .single();

      if (existing) {
        return res.status(400).json({ error: "Friend already added" });
      }

      // Insert new friend
      const { data, error } = await supabaseAdmin
        .from("friends")
        .insert({ user_id, friend_id, status: status })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json(data);
    } catch (err) {
      console.error("Add friend error:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  }
);

app.get(
  "/api/getusers",
  authMiddleware,
  async (req: Request, res: Response) => {
    const search = (req.query.search as string) || "";
    const userId = req.user?.id;

    try {
      const { data, error } = await supabaseAdmin
        .from("users")
        .select("id, username, email")
        .ilike("username", `${search}%`) // case-insensitive match
        .not("id", "eq", userId); // exclude current user

      if (error) throw error;
      console.log(`Search term: "${search}", User ID: ${userId}`);
      console.log(data, '  "/api/getusers",\n\n\n\n\n\n\n\n');
      res.json(data || []);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: (err as Error).message });
    }
  }
);

// get friends of a user
app.get("/api/friends/:user_id", async (req: Request, res: Response) => {
  const { user_id } = req.params;

  try {
    // console.log("/api/friends/${userId} running\n\n\n\n\n");
    const { data, error } = await supabaseAdmin
      .from("friends")
      .select(
        `
        friend_id,
        status,
        friend:friend_id ( id, username, email )
      `
      )
      .eq("user_id", user_id);

    if (error) throw error;
    console.log("/api/friends/${userId} running\n\n\n\n\n", data);
    res.json(data.map((item) => item.friend));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// create a new group and add creator as admin
app.post("/api/groups", authMiddleware, async (req: Request, res: Response) => {
  const { name } = req.body; // user is not on req.body
  try {
    const { data: groupData, error: groupError } = await supabaseAdmin
      .from("groups")
      .insert({
        name,
        created_by: req.user.id
      })
      .select()
      .single();
    if (groupError) throw groupError;

    const { error: memberError } = await supabaseAdmin
      .from("group_members")
      .insert({
        group_id: groupData.id,
        user_id: req.user.id,
        is_admin: true
      });
    if (memberError) throw memberError;
    res.status(201).json(groupData);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// join a group
app.post(
  "/api/group_members",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { group_id, user_id } = req.body;
    try {
      const { data, error } = await supabaseAdmin
        .from("group_members")
        .insert({
          group_id,
          user_id: user_id,
          is_admin: false
        })
        .select()
        .single();
      if (error) throw error;
      res.status(201).json(data);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }
);

app.get("/api/name/:groupId", async (req, res) => {
  const { groupId } = req.params;

  try {
    const { data, error } = await supabaseAdmin
      .from("groups")
      .select("*") // select all columns including 'name'
      .eq("id", groupId)
      .single(); // return a single object, not an array

    if (error) throw error;

    res.json(data); // { id: "...", name: "Room Name", ... }
  } catch (err) {
    console.error("Error fetching group:", err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// get groups for a user
app.get("/api/groups/:user_id", async (req: Request, res: Response) => {
  const { user_id } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from("group_members")
      .select("groups(*)")
      .eq("user_id", user_id);
    if (error) throw error;
    res.json(data.map((item) => item.groups));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get(
  "/api/groups/:group_id/members",
  async (req: Request, res: Response) => {
    const { group_id } = req.params;

    try {
      const { data, error } = await supabaseAdmin
        .from("group_members")
        .select(
          `
        user_id,
        is_admin,
        user:users!user_id(id, username, email)
      `
        )
        .eq("group_id", group_id);

      if (error) throw error;

      console.log("Raw group_members data:", data); // Add this debug

      const members = data.map((item) => ({
        id: item.user.id,
        username: item.user.username,
        email: item.user.email,
        is_admin: item.is_admin
      }));

      console.log("Processed members:", members); // Add this debug

      res.json(members);
    } catch (err) {
      console.error("Get group members error:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  }
);

// get expenses for a group
// app.get("/api/expenses/:group_id", async (req: Request, res: Response) => {
//   const { group_id } = req.params;
//   try {
//     const { data, error } = await supabaseAdmin
//       .from("expenses")
//       .select("*")
//       .eq("group_id", group_id);
//     if (error) throw error;
//     res.json(data);
//   } catch (err) {
//     res.status(500).json({ error: (err as Error).message });
//   }
// });

app.get("/api/expenses/:group_id", async (req: Request, res: Response) => {
  const { group_id } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from("expenses")
      .select(
        `
        *,
        paid_by_user:users!paid_by(id, username, email),
        expense_splits(
          user_id,
          amount,
          user:users!user_id(id, username, email)
        )
      `
      )
      .eq("group_id", group_id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Create a new expense
app.post(
  "/api/expenses",
  authMiddleware,
  async (req: Request, res: Response) => {
    const {
      group_id,
      description,
      amount,
      paid_by,
      split_with,
      date,
      notes,
      image_url
    } = req.body;
    const user_id = req.user?.id;

    if (!user_id) return res.status(401).json({ error: "Unauthorized" });

    try {
      // First, verify user is member of the group
      const { data: membership, error: memberError } = await supabaseAdmin
        .from("group_members")
        .select("*")
        .eq("group_id", group_id)
        .eq("user_id", user_id)
        .single();

      if (memberError || !membership) {
        return res.status(403).json({ error: "Not a member of this group" });
      }

      // Create the expense
      const { data: expenseData, error: expenseError } = await supabaseAdmin
        .from("expenses")
        .insert({
          group_id,
          description: description || "Untitled expense",
          amount: parseFloat(amount) || 0,
          paid_by: paid_by || user_id,
          date: date || new Date().toISOString().split("T")[0],
          notes,
          image_url,
          created_by: user_id
        })
        .select()
        .single();

      if (expenseError) throw expenseError;

      // Create expense splits
      const splitAmount = parseFloat(amount) / split_with.length;
      const splits = split_with.map((userId: string) => ({
        expense_id: expenseData.id,
        user_id: userId,
        amount: splitAmount
      }));

      const { error: splitsError } = await supabaseAdmin
        .from("expense_splits")
        .insert(splits);

      if (splitsError) throw splitsError;

      // Return the complete expense data
      const { data: completeExpense, error: fetchError } = await supabaseAdmin
        .from("expenses")
        .select(
          `
        *,
        paid_by_user:paid_by(id, username, email),
        expense_splits(
          user_id,
          amount,
          user:user_id(id, username, email)
        )
      `
        )
        .eq("id", expenseData.id)
        .single();

      if (fetchError) throw fetchError;

      res.status(201).json(completeExpense);
    } catch (err) {
      console.error("Create expense error:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  }
);

// Get group members for expense splitting
app.get(
  "/api/groups/:group_id/members",
  async (req: Request, res: Response) => {
    const { group_id } = req.params;

    try {
      const { data, error } = await supabaseAdmin
        .from("group_members")
        .select(
          `
        user_id,
        is_admin,
        user:user_id(id, username, email)
      `
        )
        .eq("group_id", group_id);

      if (error) throw error;

      const members = data.map((item) => ({
        id: item.user.id,
        username: item.user.username,
        email: item.user.email,
        is_admin: item.is_admin
      }));

      res.json(members);
    } catch (err) {
      console.error("Get group members error:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  }
);

// * error handling for DB queries * //
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response
    // next: NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: "An unexpected error occurred!" });
  }
);

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
