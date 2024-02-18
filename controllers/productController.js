import { Product, User } from "../models/index.js";
import multer from "multer";
import path from 'path';
import CustomErrorHandler from "../services/CustomErrorHamdler.js";
import fs from 'fs';
import Joi from "joi";
import productSchema from "../validators/productValidator.js";



//upload a file into folder and written a file name
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads'),
    filename: (req, file, cb) => {

        //create a unique name
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        console.log("unique : ",uniqueName);
        cb(null, uniqueName);
    }
});

const handleMultipartData = multer({ storage, limits: { fileSize: 1000000 * 5}}).single('image') //5mb

const productController = {
    async store(req, res, next) {
        //multipart form data

        handleMultipartData(req, res, async(error1) => {
            if(error1) {
                return next(CustomErrorHandler.serverError(error1.message));
            }

            console.log(req.file);
            const filePath = req.file.path;

            // validation

            const { error } = productSchema.validate(req.body);

            if(error) {
                //delete the uploaded file

                fs.unlink(`${appRoot}/${filePath}`, (err) => {
                    if(err) {
                        return next(CustomErrorHandler.serverError(err.message));
                    }
                });

                return next(error);
                //rootfolder/uploads/filename.png
            }

            const {name, price, size } = req.body;

            let document;

            try {
                document = await Product.create({
                    name,
                    price,
                    size,
                    image: filePath
                });
            } catch (error) {
                return next(error);
            }

            res.status(201).json({document});
        });
    },

    async update(req, res, next) {
        //multipart form data

        handleMultipartData(req, res, async(error1) => {
            if(error1) {
                return next(CustomErrorHandler.serverError(error1.message));
            }

            let filePath;
            if(req.file) {
                filePath = req.file.path;
            }

            const { error } = productSchema.validate(req.body);

            if(error) {
                //delete the uploaded file

                if(req.file) {
                    fs.unlink(`${appRoot}/${filePath}`, (err) => {
                        if(err) {
                            return next(CustomErrorHandler.serverError(err.message));
                        }
                    });
                }

                return next(error);
                //rootfolder/uploads/filename.png
            }

            const {name, price, size } = req.body;

            let document;

            try {
                document = await Product.findOneAndUpdate({_id:req.params.id }, {
                    name,
                    price,
                    size,
                    ...(req.file && { image: filePath })
                }, { new : true });

            } catch (error) {
                return next(error);
            }

            res.status(201).json({document});
        });
    },

    async destroy(req, res, next) {
        const document = await Product.findOneAndDelete({_id:req.params.id});

        if(!document) {
            return next(new Error('Nothing to delete'));
        }

        //image delete
        const imagePath = document._doc.image;

        console.log(imagePath);
        fs.unlink(`${appRoot}/${imagePath}`, (err) => {
            if(err) {
                return next(CustomErrorHandler.serverError());
            }
            res.json(document);
        });

    },

    async index(req, res, next) {
        let documents;

        // pagination mongoose-pagination

        try {
            documents = await Product.find().select('-updatedAt -__v').sort({ _id: -1 });

        } catch (error) {
            return next(CustomErrorHandler.serverError());
        }

        return res.json(documents);
    },

    async show(req, res, next) {
        let document;

        try {
            document = await Product.findOne({_id: req.params.id}).select('-updatedAt -__v');
        } catch (error) {
            return next(CustomErrorHandler.serverError());
        }

        return res.json(document);
    }
}

export default productController;