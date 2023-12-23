import multer from "multer";
import path from "path";

const allowedImageExtensions = [".jpg", ".jpeg", ".png", ".gif"];

const fileFilter = (req: any, file: any, cb: any) => {
    const extensioname = path.extname(file.originalname).toLowerCase();
    if (allowedImageExtensions.includes(extensioname)) {
        return cb(null, true);
    }
    cb(new Error("Invalid file type. Only pdfs are allowed."));
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./storage/images/");
    },
    filename: (req: any, file, cb) => {
        const extname = path.extname(file.originalname);
        if (req.adminId) {
            cb(null, req.adminId + Date.now() + extname);
        } else if (req.userId) {
            cb(null, req.userId + Date.now() + extname);
        } else {
            cb(null, Date.now() + extname);
        }
    },
});

const upload = multer({ storage, fileFilter: fileFilter });

export default upload;
