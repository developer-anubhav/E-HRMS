import mongoose from "mongoose";
import { Readable } from "stream";

/**
 * Returns the GridFSBucket instance for companyDocs bucket.
 */
export const getGridFSBucket = () => {
  if (!mongoose.connection.db) {
    throw new Error("Database connection is not established yet.");
  }
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "companyDocs",
  });
};

/**
 * Streams a buffer to MongoDB GridFS and returns the generated GridFS fileId.
 * @param {Buffer} buffer 
 * @param {string} filename 
 * @param {string} mimetype 
 * @returns {Promise<mongoose.Types.ObjectId>}
 */
export const uploadToGridFS = (buffer, filename, mimetype) => {
  return new Promise((resolve, reject) => {
    try {
      const bucket = getGridFSBucket();
      const uploadStream = bucket.openUploadStream(filename, {
        contentType: mimetype,
      });

      const readableStream = Readable.from(buffer);

      uploadStream.on("finish", () => {
        resolve(uploadStream.id);
      });

      uploadStream.on("error", (error) => {
        reject(error);
      });

      readableStream.pipe(uploadStream);
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Creates a GridFS download stream for a given GridFS fileId.
 * @param {string|mongoose.Types.ObjectId} fileId 
 * @returns {import('mongodb').GridFSBucketReadStream}
 */
export const getDownloadStream = (fileId) => {
  const bucket = getGridFSBucket();
  const objectId = typeof fileId === "string" ? new mongoose.Types.ObjectId(fileId) : fileId;
  return bucket.openDownloadStream(objectId);
};
