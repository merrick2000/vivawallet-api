import pool from '../../db.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const isAuthenticated = async (req, res, next) => {
    // check Bearer token
    const header = req.headers.authorization;
    if(header) {
        const [type, token] = req.headers.authorization.split(' ');
    
        if (!token) {
            return res.status(401).json({ msg: 'No token, authorization denied' });
        } 
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
            req.user = await decoded.data;
            next();
        } catch (err) {
            return res.status(401).json({ msg: 'Token is not valid' });
        }

    } else {
        return res.status(401).json({msg: "Authorization is requiered"})
    }
}


export default isAuthenticated;