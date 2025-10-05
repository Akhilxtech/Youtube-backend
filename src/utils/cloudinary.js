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

const deleteFromCloudinary=async(oldFileUrl)=>{
   try {
     if(!oldFileUrl){
        return null;
     }
    const parts = oldFileUrl.split("/");
    const fileNameWithExt = parts.pop(); // "abc123.jpg"
    const folderPath = parts.slice(parts.indexOf("upload") + 1).join("/"); // "v1691234567/user_avatars"
    const publicId = folderPath.replace(/^v\d+\//, "") + "/" + fileNameWithExt.split(".")[0]; // "user_avatars/abc123"



    const response=await cloudinary.uploader.destroy(publicId);
        return response;
    } catch (error) {
        return null;
   }
}

export {uploadOnCloudinary,deleteFromCloudinary}