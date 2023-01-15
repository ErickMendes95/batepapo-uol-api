import express from 'express'
import cors from 'cors'
import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'
import joi from 'joi'
import dayjs from 'dayjs'

dotenv.config()

const mongoClient = new MongoClient(process.env.DATABASE_URL);

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
        const lista = await db.collection("participants").find({}).toArray()
        return res.status(200).send(lista)
    }
	catch(err){
        console.log(err)
    }
	}
)

app.get("/messages", async (req, res) => {
	const limit = parseInt(req.query.limit)
    const { User } = req.header
    
    try{
        const mensagens = await db.collection("messages").find({ $or: [ {from: User}, {to: User} ] }).toArray()
        const arrayInvertidoMensagens = [...mensagens].reverse()
        if(!limit){
            return res.send(mensagens)
        }

        res.send(arrayInvertidoMensagens.slice(0,limit))
    }
	catch(err){
        console.log(err)
    }
}
)

app.post("/participants", async (req, res) => {
    const user = req.body

    try{
        const userSchema = joi.object({
            name: joi.string().required()
        })

        const validation = userSchema.validate(user, { abortEarly: true });

        if (validation.error) {
          return res.status(422).send(validation.error.details)
        }

        const userExiste = await db.collection("participants").findOne({name: user.name})

        if(userExiste){
            return res.sendStatus(409)
        }

            await db.collection("participants").insertOne({ 
                name: user.name, 
                lastStatus: Date.now()})

            await db.collection("messages").insertOne({
                from: user.name,
                to: 'Todos',
                text: 'entra na sala...',
                type: 'status',
                time: dayjs().format("HH:MM:SS")})
            res.sendStatus(201)
    } catch(err){
        console.log(err)
    }

})

app.post("/messages", async (req, res) => {
    const { User } = req.header 
	const message = req.body
	
    try{

        if(!User){
            return res.sendStatus(422)
        }

        const userExiste = await db.collection("participants").findOne({name: User})
    
        if(!userExiste){
            return res.sendStatus(422)
        }
        const messageSchema = joi.object({
            to: joi.string().required(),
            text: joi.string().required(),
            type: joi.string().valid("message","private_message").required
        })

        const validation = messageSchema.validate(message, { abortEarly: false });


        if (validation.error) {
          return res.status(422).send(validation.error.details)
        }

        await db.collection("messages").insertOne({
            from: User, 
            to: message.to, 
            text: message.text, 
            type: message.type, 
            time: dayjs().format('HH:MM:SS')
        })

        res.sendStatus(201)    
    } catch (err){
        console.log(err)
    }    
}
)

app.post("/status", async (req, res) => {
	const {User} = req.header

    try{

        const userExiste = await db.collection("participants").find({name: User})

        if(!userExiste){
            return res.sendStatus(404)
        }

        await db.collection(participants).updateOne({name: User}, { $inc: { lastStatus: Date.now() }})

        res.sendStatus(200)

    } catch (err){
        console.log(err)
    }
	
}
)

app.listen(process.env.PORT)