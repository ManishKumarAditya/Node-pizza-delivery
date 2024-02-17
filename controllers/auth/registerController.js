import Joi from "joi";
import CustomErrorHandler from "../../services/CustomErrorHamdler.js";
import { RefreshToken, User } from '../../models/index.js';
import bcrypt from 'bcrypt';
import JwtService from "../../services/JwtService.js";
import { REFRESH_SECRET } from "../../config/index.js";

const registerController = {
    async register(req, res, next) {
        //validation
        const registerSchema = Joi.object({
            name : Joi.string().min(3).max(30).required(),
            email : Joi.string().email().required(),
            password : Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
            repeat_password : Joi.ref('password')
        });

        console.log("manish");
        console.log(req.body);
        const { error } = registerSchema.validate(req.body);

        if(error) {
           return next(error);
        }
        
        // check if the user is in database already
        try {
            const exist = await User.exists({email: req.body.email});
            if(exist) {
                return next(CustomErrorHandler.alreadyExist('This email is already taken!'));
            }
        } catch (error) {
            return next(error)
        }

        const { name, email, password } = req.body;

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // prepare the model
        const user = new User({
            name,
            email,
            password: hashedPassword,
        });

        let access_token;
        let refresh_token;
        
        try {
            const result = await user.save();

            console.log(result);

            // Token
            access_token = JwtService.sign({_id : result._id, role: result.role});

            refresh_token = JwtService.sign({_id : result._id, role: result.role}, '1y', REFRESH_SECRET);

            //database whitelist
            await RefreshToken.create({ token: refresh_token });
        } catch (error) {
            return next(error);
        }

        res.json({ access_token, refresh_token });

        // logic
       
    }
}

export default registerController;