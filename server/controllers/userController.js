import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs"
import cloudinary from "../lib/cloudinary.js";

export const signup = async(req, res) => {
    const { fullName , email, password, bio} = req.body;


    try {
        if(!fullName || !email || !password || !bio){
            return res.json({ success: false, message: "Missing Details"});
        }
        const user = await User.findOne({email});

        if(user) {
            return res.json({success:false, message: "Account already exists"})
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            fullName, email, password: hashedPassword, bio
        });

        const token = generateToken(newUser._id);
        res.json({
            success: true,
            userData: newUser,
            token,
            message: "Account created successfully"
        })
    } catch(error){
        console.log(error.message);
        res.json({
            success: false,
            message:error.message
        })
    }
}



//for login


export const login = async (req, res) => {
   try {
     const { email, password} = req.body;
     const userData = await User.findOne({email});


     const isPasswordCorrect =  bcrypt.compare(password, userData.password);

     if(!isPasswordCorrect) {
        return res.json({ 
            success: false,
            message: "Invalid credentials"
        });
     }
    const token = generateToken(userData._id);
    res.json({ success: true, userData, token, message: "Login successful"})
   } catch(error) {
     console.log(error.message);
        res.json({
            success: false,
            message:error.message
        })
   }
}



// function to check if user is authenticated


export const checkAuth = (req, res) => {
    res.json({success: true, user: req.user});
}



export const updateProfile = async(req, res) => {
    try {
        const { profilePic, bio, fullName } = req.body;
        const userId = req.user._id;
        console.log("Updating profile for user:", userId);

        let updatedUser;

        if(!profilePic){
            console.log("No profilePic provided, updating bio and name only");
            updatedUser = await User.findByIdAndUpdate(userId, { bio, fullName }, { new: true });
        } else {
            console.log("Uploading profile pic...");
            const upload = await cloudinary.uploader.upload(profilePic);
            console.log("Upload result:", upload.secure_url);
            updatedUser = await User.findByIdAndUpdate(userId, { profilePic: upload.secure_url, bio, fullName }, { new: true });
        }

        console.log("Profile updated successfully:", updatedUser);
        res.json({ success: true, user: updatedUser });
    } catch(error) {
        console.log("Profile update error:", error);
        res.json({ success: false, message: error.message });
    }
}
