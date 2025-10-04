import {v2 as cloudinary} from "cloudinary"  
import { response } from "express";
import fs from "fs" 

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret:process.env.API_SECRET
});

const uploadOnCloudinary=async (localFilePath)=>{
    try {
        if(!localFilePath) return null
        // upload the file on cloudinary
        const response =await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        // file has been uploaded successfully
        console.log("file is uploded on cloudinary",reponse.url);
        return response;
        
    } catch (error) {
        // remove locally saved temp file from local server as the operetion got failed

        fs.unlinkSync(localFilePath);
        return null;
    }
}

export {uploadOnCloudinary}