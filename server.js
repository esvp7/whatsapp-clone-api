//imports
import express from "express";
import mongoose from "mongoose";
import Pusher from "pusher";
import Messages from "./dbMessages.js";
import cors from "cors";

//app config
const app = express();
const URI = "mongodb+srv://esvp:Kubin200519@cluster0.ehswueg.mongodb.net/whatsaappdb?retryWrites=true&w=majority"
const pusher = new Pusher({
  appId: "1434240",
  key: "c67d90a3e55a2b5c3043",
  secret: "990f2bafb66a915ed17f",
  cluster: "us3",
  useTLS: true
}); 

const db = mongoose.connection;

db.once('open' , () => {
	console.log("DB CONNECTED");

	const msgCollection = db.collection('messagecontents');
	const changeStream = msgCollection.watch();

	changeStream.on('change' , (change) => {
		console.log(change);

	if (change.operationType === "insert") {
		const messageDetails = change.fullDocument;
		pusher.trigger('messages' , 'inserted' ,
		    {
		    	name: messageDetails.name,
		    	message: messageDetails.message,
		    	timestamp: messageDetails.timestamp,
		    	received: messageDetails.received,
		    }
	    );
	} else {
		console.log('error triggering pusher')
	    }
	});
});


//middleware 
app.use(express.json());
app.use(cors());

//DB config
mongoose.connect(URI,
    err => {
        if(err) throw err;
        console.log('connected to MongoDB')
    });

//api routes
app.get('/', (req, res) => {
    res.send('hello ur mom');
});

app.get('/messages/sync', (req, res) => {
	Messages.find((err, data) => {
		if (err) {
			res.status(500).send(err)
		} else {
			res.status(200).send(data)
		}
	})
})

app.post('/messages/new', (req, res) => {
	const dbMessage = req.body

	Messages.create(dbMessage, (err, data) => {
		if (err) {
			res.status(500).send(err)
		} else {
			res.status(201).send(`new message created: \n ${data}`)
		}
	})
})

//port listen
const server = app.listen(process.env.PORT || 8081, () => {
    console.log('app is running on port '+ (process.env.PORT || 8081))
})
