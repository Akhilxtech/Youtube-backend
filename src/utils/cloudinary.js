import {v2 as cloudinary} from "cloudinary"  
import fs from "fs" 

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary=async (localFilePath)=>{
    try {
        if(!localFilePath) return null
        // upload the file on cloudinary
        const response =await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        // file has been uploaded successfully
        // console.log("file is uploded on cloudinary",response.url);
        console.log("deleteing file path: ",localFilePath);
        
        fs.unlinkSync(localFilePath);
        return response;
        
    } catch (error) {
        // remove locally saved temp file from local server as the operetion got failed
        console.log("cloudinary error: ",error);
        
        fs.unlinkSync(localFilePath);
        return null;
    }
}

export {uploadOnCloudinary}