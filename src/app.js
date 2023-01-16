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
	const limit = req.query.limit
    const { user } = req.headers
    
    try{

        if(limit<=0){
            return res.sendStatus(422)
        }

        if(isNaN(limit)){
            return res.sendStatus(422)
        }

        const mensagens = await db.collection("messages").find({ $or: [ {from: user}, {to: 'Todos'}, {to: user} ] }).toArray()
        const arrayInvertidoMensagens = [...mensagens].reverse()


        if(parseInt(limit)){
            return res.send(arrayInvertidoMensagens.slice(0,parseInt(limit)))
        }
        
        res.send(arrayInvertidoMensagens)

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
                time: dayjs().format("HH:mm:ss")
            })
            
            res.sendStatus(201)
    } catch(err){
        console.log(err)
    }

})

app.post("/messages", async (req, res) => {
    const message = req.body
    const {user} = req.headers 

    try{

        if(!user){
            return res.sendStatus(422)
        }

        const userExiste = await db.collection("participants").findOne({name: user})
    
        if(!userExiste){
            return res.sendStatus(422)
        }
        const messageSchema = joi.object().keys({
            to: joi.string().required(),
            text: joi.string().required(),
            type: joi.string().valid('message','private_message').required()
        })

        const validation = messageSchema.validate(message, { abortEarly: true });


        if (validation.error) {
          return res.status(422).send(validation.error.details)
        }

        await db.collection("messages").insertOne({
            from: user, 
            to: message.to, 
            text: message.text, 
            type: message.type, 
            time: dayjs().format('HH:mm:ss')
        })

        return res.sendStatus(201)    
    } catch (err){
        console.log(err)
    }    
}
)

app.post("/status", async (req, res) => {
	const {user} = req.headers

    try{

        const userExiste = await db.collection("participants").findOne({name: user})

        if(!userExiste){
            return res.sendStatus(404)
        }

        await db.collection("participants").updateOne({name: user}, { $inc: { lastStatus: Date.now() }})

        res.sendStatus(200)

    } catch (err){
        console.log(err)
    }
	
}
)

setInterval(async () => {

    const users = await db.collection("participants").find().toArray()
    users.map(async (item) => {
        
        if(item.lastStatus < Date.now() - 10){
            await db.collection("participants").deleteOne({name: item.name})
            await db.collection("messages").insertOne({
                from: item.name, 
                to: 'Todos', 
                text: 'sai da sala...',
                type: 'status', 
                time: dayjs().format('HH:mm:ss')
            })
        }
    })
}, 15000);
const port = process.env.PORT || 5000
app.listen(port)