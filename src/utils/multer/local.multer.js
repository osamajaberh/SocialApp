import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import {
  documentAllowedType,
  imageAllowedType,
  pdfAllowedType,
  videoAllowedType,
} from "../../constants/constants.js";

export const fileValidation = {
  image: imageAllowedType,
  pdf: pdfAllowedType,
  document: [...pdfAllowedType, ...documentAllowedType],
  video: videoAllowedType,
};

export const uploadFileDisck = (
  customPath = "general",
  fileValidationArray = []
) => {
  const basePath = `uploads/${customPath}`;
  const fullPath = path.resolve(`./src/${basePath}`);

  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, fullPath);
    },
    filename: (req, file, cb) => {
       const finalFileName=  Date.now() + "-" + Math.round(Math.random() * 1e9) + file.originalname;
       file.finalPath = basePath+"/"+finalFileName
      cb(null,finalFileName);
    },
  });

  function fileFilter(req, file, cb) {
    if (fileValidationArray.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed.`), false);
    }
  }

  return multer({ fileFilter, storage });
};
