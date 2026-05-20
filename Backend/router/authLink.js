const express=require('express');
const linkwa=require('../auth/linkControl')
const route=express.Router()

route.get('/callback', linkwa.linkedInCallback )

module.exports=route;