import express from 'express'
import cors from 'cors'
import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'
dotenv.config()

const mongoClient = new MongoClient(process.env.DATABASE_URL)
let db;

await mongoClient.connect()
try {
   db = mongoClient.db()
}  catch (err){
	console.log(err)
}


const server = express()

server.use(cors())
server.use(express.json())
