import { useState } from "react"
import "./Profile.scss"

// interface ProfileProps {
//     profileImage: string | null,
//     setProfileImage: string | null
// }

const Profile = (props) => {
    const { setProfileImage } = props

    const [name, setName] = useState("")

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

  const handleChange = (e) => {
    e.preventDefault()
  }

return (
<div className="profile-wrapper">
    <div className="profile-pic-container">
        <label htmlFor="image-input">Upload Profile Image:</label>
        <input className="image-input" type="file" accept="image/*" onChange={handleImage} />
    </div>    
    <div className="profile-name-container">
        <label htmlFor="profile-name">Input Name:</label>
        <input className="profile-name" type="text" onChange={(e) => setName(e.target.value)} />
    </div>    

</div>
)
}


export default Profile
