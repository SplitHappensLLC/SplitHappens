import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import "./Profile.scss"
import { supabase } from "../../supabase/supabaseClient"; // adjust path
// import { Auth } from '@supabase/auth-ui-react';

// interface ProfileProps {
//     profileImage: string | null,
//     setProfileImage: string | null
// }

const Profile = (props) => {
    const { setProfileImage } = props
     const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);


    const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onloadend = () => {
        setProfileImage(reader.result as string); // preview as base64
      };

      reader.readAsDataURL(file);
    }
  };
useEffect(() => {
  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    console.log(session)
    const userId = session?.user?.id;

    if (!userId) {
      console.log("No user logged in");
      return;
    }

    console.log("Fetching profile for userId:", userId);

    const res = await fetch(`/api/users/${userId}`);
    if (!res.ok) {
      console.error("Backend error:", res.statusText);
      return;
    }

    const profile = await res.json();
    setUser(profile);
  };

  fetchProfile();
}, []);
if (!user) return <div>Loading...</div>;

return (
<div className="profile-wrapper">
    <Link className="back-home-btn" to='/' >Back to Home</Link>
    <div className="profile-pic-container">
        <label htmlFor="image-input">Upload Profile Image:</label>
        <input className="image-input" type="file" accept="image/*" onChange={handleImage} />
    </div>    
    <div className="profile-name-container">
        <div className="profile-name">Username: <span className="profile-el">{user.username}</span> </div>
    </div>    
    <div className="profile-email-container">
         <div className="profile-email">Email: <span className="profile-el">{user.email}</span> </div>
    </div> 
</div>
)
}


export default Profile
