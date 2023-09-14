const express = require('express')
const bodyparser = require('body-parser')
const bcrypt = require('bcrypt-nodejs')
const cors = require('cors')
const knex = require('knex')
const fetch = (...args) => 
    import('node-fetch').then(({default: fetch}) => fetch(...args))

import express from 'express'


const db = knex({
    client: 'pg',
    connection: {
        // connectionString: 'postgres://game_list_db_user:LEbzRKsZ1HYt8k3nCGdIxS87Qqo2Hwis@dpg-ck02vi95mpss73c7blfg-a.oregon-postgres.render.com/game_list_db',
        // ssl: {rejectUnauthorized: false},
        host: 'dpg-ck02vi95mpss73c7blfg-a',
        port: 5432,
        user: 'game_list_db_user',
        password: 'LEbzRKsZ1HYt8k3nCGdIxS87Qqo2Hwis',
        database: 'game_list_db'
    }
})

// const db = knex({
//   client: 'pg',
//   connection: {
//     host: '127.0.0.1',
//     user: 'postgres',
//     password: 'Wiggles123',
//     database: 'game-list'
//   }
// });


const app = express()
app.use(bodyparser.json())
app.use(cors())
 

app.get('/', (req,res) => {
    res.json('success')
})

app.post('/signin', (req, res) => {
    const {email, password} = req.body
    if(!email || !password) {
        res.status(400).json('incorrect form submission')
    }
    db.select('email', 'hash').from('login')
    .where('email', '=', email)
    .then(data => {
        if(email === 'Demo'
        ){
            return db.select('*').from('users')
            .where('email', '=', email)
            .then(user => {
                res.json(user[0])
            })
        } else {
        const isValid = bcrypt.compareSync(password, data[0].hash)  
        if(isValid) {
            return db.select('*').from('users')
            .where('email', '=', email)
            .then(user => {
                res.json(user[0])
            })
            .catch(err => res.status(400).json('unable to get user'))
        } else {
            res.status(400).json('wrong cridentials')
        }
        }
        
    })
    .catch(err =>  res.status(400).json('wrong cridentials'))
})

app.post('/register', (req, res) => {
    const {name, email, password} = req.body
    const hash = bcrypt.hashSync(password)
    if(!name || !email || !password) {
        res.status(400).json('please fill in info')
    } else {
        db.transaction(trx => {
            trx.insert({
                hash: hash,
                email: email
            })
            .into('login')
            .returning('email')
            .then(loginEmail => {
                return trx('users')
        .returning('*')
        .insert({
            email: loginEmail[0].email,
            name: name,
            log: []
        }).then(user => {
            res.json(user[0])
            let id = user[0].id
            db.schema.createTable(`personal${id}`, (table) => {
            table.increments('id').primary();
            table.string('user')
            table.string('name')
            table.string('completion')
            table.string('image')
        })
        .then()
            })
        })
        .then(trx.commit)
        .catch(trx.rollback)
        })
        .catch(err => res.status(400).json('unable to register'))    
    }    
})

app.get('/profile/:id', (req, res) => {
    const {id} = req.params
    db.select('id').from('users').where({id})
    .then(user => {
        if(user.length) {
            res.json(user[0])
        } else {
            res.status(400).json('not found')
        }
    })
    .catch(err => res.status(400).json('error getting user'))
})


app.put('/search', (req, res) => {
    const {itemSearch} = req.body

    const url = `https://rawg-video-games-database.p.rapidapi.com/games/${itemSearch}?key=a8d817fa172443748735ff2d10862681`

    const options = {
        method: 'GET',
        headers: {
        'X-RapidAPI-Key': '48bcd47c97msh29aeb9d40c8bed9p1b117bjsn539a69073325',
        'X-RapidAPI-Host': 'rawg-video-games-database.p.rapidapi.com'            
        }
    }

    fetch(url, options)
    .then(res => res.json())
    .then(json => res.json(json))
	.catch(err => console.error('error:' + err));
    
})

app.put('/pers', (req, res) => {
    const {id} = req.body
    db(`personal${id}`)
    .orderBy('id')
    .select('name', 'completion', 'image')
    .then(response => res.json(response))
})

app.put('/entries', (req, res) => {
    const {id, user ,name, image} = req.body

    db('users').where('id', '=', id)
    .update({
        log: db.raw('array_append( log, ?)', [name])})
    .increment('started', 1)
    .returning('*')
    .then(response => {
        res.json(response)
    })

    db(`personal${id}`)
    .returning('*')
    .insert({
        user: user,
        name: name,
        completion: 'started',
        image: image
    })
    .then(console.log)
}) 

app.put('/select', (req, res) => {
    const {id, name, completion} = req.body
    db(`personal${id}`)
    .where('name', '=', name)
    .then(row => {
        if(row[0].completion === 'started') {
            if(completion === 'started') {
                console.log('no');  
            } else if(completion === 'finish') {
                db('users')
                .where({id: id})
                .whereRaw('? = ANY(log)', name)
                .increment('finish', 1)
                .decrement('started', 1)
                .returning('*')
                .then(user => {console.log(user[0])})
            } else if(completion === 'complete') {
                db('users')
                .where({id: id})
                .whereRaw('? = ANY(log)', name)
                .increment('complete', 1)
                .decrement('started', 1)
                .returning('*')
                .then(user => {console.log(user[0])})
            }
        } else if(row[0].completion === 'finish') {
            if(completion === 'finish') {
                console.log('no');  
            } else if(completion === 'started') {
                db('users')
                .where({id: id})
                .whereRaw('? = ANY(log)', name)
                .increment('started', 1)
                .decrement('finish', 1)
                .returning('*')
                .then(user => {console.log(user[0])})
            } else if(completion === 'complete') {
                db('users')
                .where({id: id})
                .whereRaw('? = ANY(log)', name)
                .increment('complete', 1)
                .decrement('finish', 1)
                .returning('*')
                .then(user => {console.log(user[0])})
            }
        } else if(row[0].completion === 'complete') {
            if(completion === 'complete') {
                console.log('no');  
            } else if(completion === 'started') {
                db('users')
                .where({id: id})
                .whereRaw('? = ANY(log)', name)
                .increment('started', 1)
                .decrement('complete', 1)
                .returning('*')
                .then(user => {console.log(user[0])})
            } else if(completion === 'finish') {
                db('users')
                .where({id: id})
                .whereRaw('? = ANY(log)', name)
                .increment('finish', 1)
                .decrement('complete', 1)
                .returning('*')
                .then(user => {console.log(user[0])})
            }
        } 
    })
    .then(
          db(`personal${id}`)
        .where('name', '=', name)
        .update({completion : completion})
        .returning('completion')
        .then(response => {
           res.json(response)
        })  
    )    
})

app.put('/log_delete', (req, res) => {
    const {id, name, select} = req.body

    db('users').select('log').where({id: id})
    .then(data => {
        let log = data[0].log
        let index = log.indexOf(name)
       log.splice(log[index], 1)
       db('users').select('log').where({id: id})
        .update({
            log: log
        }).then(() => {
            db('users').where({id: id})
            .decrement(`${select}`, 1)
            .returning(`${select}`)
            .then(data => res.json(data[0]))
        })
    })
})

app.delete('/pers_delete', (req, res) => {
    const {id, name} = req.body

    db(`personal${id}`).where({name: name}).del()
    .select()
    .then(data => res.json(data))
})

 app.put('/select_delete', (req, res) => {
    const {id, select} = req.body

    db('users').where({id: id})
    .increment(`${select}`, 1)
    .returning(`${select}`)
    .then(data => res.json(data[0]))
 })

app.listen(process.env.PORT || 3000, () => {
    console.log(`app is running on ${process.env.PORT}`)
})