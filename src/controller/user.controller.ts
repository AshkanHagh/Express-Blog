import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import generateTokenAndSetCookie from '../utils/generateToken';
import mongoose from 'mongoose';

import User from '../models/user.model';
import { IUser } from '../types/types';


export const signup = async (req : Request, res : Response) => {

    try {
        const { fullName, username, password, confirmPassword, gender } = req.body;

        const isUserExists = await User.findOne<IUser>({username});
        
        if(isUserExists) return res.status(400).json({error : 'User already exists'});

        if(password !== confirmPassword) return res.status(400).json({error : 'password dose not match'});

        const salt = await bcrypt.genSalt(8);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            fullName,
            username,
            password : hashedPassword,
            gender
        });

        if(user) {
            generateTokenAndSetCookie(user._id.toString(), res);
            await user.save();

            res.status(201).json({_id : user._id, fullName : user.fullName, username : user.username});

        }else {

            res.status(400).json({error : 'Invalid data'});
        }

    } catch (error) {
        
        console.log('error in signup controller :', error);

        res.status(500).json({error : 'Internal server error'});
    }

}

export const login = async (req : Request, res : Response) => {

    try {
        const { username, password } = req.body;

        const user = await User.findOne({username});
        const isPassword = await bcrypt.compare(password, user?.password || '');

        if(!user || !isPassword) return res.status(400).json({error : 'Invalid username or password'});

        if(user.isFreeze == true) user.isFreeze = false;
        await user.save();

        generateTokenAndSetCookie(user._id.toString(), res);

        res.status(200).json({_id : user._id, fullName : user.fullName, username : user.username});

    } catch (error) {
        
        console.log('error in login controller :', error);

        res.status(500).json({error : 'Internal server error'});
    }

}

export const logout = async (req : Request, res : Response) => {

    try {
        res.cookie('jwt', '', {maxAge : 1});
        res.status(200).json({message : 'logged out successfully'});

    } catch (error) {
        
        console.log('error in logout controller :', error);

        res.status(500).json({error : 'Internal server error'});
    }

}

export const profile = async (req : Request, res : Response) => {

    try {
        const currentUser = await User.findById(req.user._id).select('-password -createdAt');

        if(!currentUser) return res.status(404).json({error : 'User not found'});

        res.status(200).json(currentUser);

    } catch (error) {
        
        console.log('error in profile controller :', error);

        res.status(500).json({error : 'Internal server error'});
    }

}

export const updateProfile = async (req : Request, res : Response) => {

    try {
        const { fullName, username, password, gender, bio } = req.body;
        const currentUserId : string = req.user._id;

        let currentUser = await User.findById(currentUserId);

        if(req.params.id !== currentUserId.toString()) return res.status(400).json({error : 'You cannot change others profile'});

        if(password) {

            const salt = await bcrypt.genSalt(8);
            const hashedPassword = await bcrypt.hash(password, salt);

            currentUser.password = hashedPassword;
        }

        currentUser.fullName = fullName || currentUser.fullName;
        currentUser.username = username || currentUser.username;
        currentUser.gender = gender || currentUser.gender;
        currentUser.bio = bio || currentUser.bio;

        await currentUser.save();

        currentUser.password = null;

        res.status(201).json(currentUser);

    } catch (error) {
        
        console.log('error in updateProfile controller :', error);

        res.status(500).json({error : 'Internal server error'});
    }

}

export const searchUser = async (req : Request, res : Response) => {

    try {
        const { query } = req.params;

        let user;

        if(mongoose.Types.ObjectId.isValid(query)) {
            user = await User.findOne({_id : query});

        }else {
            user = await User.findOne({username : query});
        }

        if(!user) return res.status(404).json({error : 'User not found'});

        if(user.isFreeze == true) return res.status(200).json({message : 'This Account is been freezed'});

        res.status(200).json(user);

    } catch (error) {
        
        console.log('error in searchUser controller :', error);

        res.status(500).json({error : 'Internal server error'});
    }

}

export const freezeAccount = async (req : Request, res : Response) => {

    try {
        res.cookie('jwt', '', {maxAge : 1});

        await User.findByIdAndUpdate(req.user._id, {isFreeze : true});

        res.status(200).json({message : 'Account freezed successfully'});

    } catch (error) {
        
        console.log('error in freezeAccount controller :', error);

        res.status(500).json({error : 'Internal server error'});
    }

}

export const follow = async (req : Request, res : Response) => {

    try {
        const { id } = req.params;
        const userId : string = req.user._id;

        const userToModify = await User.findById(id);
        const currentUser =  await User.findById(userId);

        if(id === userId) return res.status(400).json({error : 'You cannot follow/unFollow your self'});
        if(!userToModify || !currentUser) return res.status(404).json({error : 'User not found'});

        const isFollowing = currentUser.following.includes(id);

        if(isFollowing) {
            // unFollow
            await User.findByIdAndUpdate(req.user._id, {$pull : {following : id}});
            await User.findByIdAndUpdate(id, {$pull : {followers : req.user._id}});

            res.status(200).json({message : 'User unFollowed successfully'});

        }else {
            // follow
            await User.findByIdAndUpdate(req.user._id, {$push : {following : id}});
            await User.findByIdAndUpdate(id, {$push : {followers : req.user._id}});

            res.status(200).json({message : 'User followed successfully'});
        }

    } catch (error) {
        
        console.log('error in follow controller :', error);

        res.status(500).json({error : 'Internal server error'});
    }

}