import express, { application } from 'express'
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


const app = express()

app.use(cors())
app.use(express.json())

app.get("/participants", async (req, res) => {
    try{
        const lista = db.collection("participants").find({}).toArray()
        return res.status(200).send(lista)
    }
	catch(err){
        console.log(err)
    }
	}
)

app.get("/messages", async (req, res) => {
	
	
}
)

app.post("/participants", async (req, res) => {
	
	
    }
)

app.post("/messages", async (req, res) => {
	
	
}
)

app.post("/status", async (req, res) => {
	
	
}
)

app.listen(process.env.PORT)