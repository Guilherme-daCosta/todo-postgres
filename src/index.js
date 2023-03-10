const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { user } = require('pg/lib/defaults');
require('dotenv').config()

const PORT = process.env.PORT || 3333;

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL
});

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {console.log('ola mundo')});

app.get('/users', async(req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM users');
        return res.status(200).send(rows);
    } catch (err) {
        return res.status(400).send(err);
    }
});

app.post('/session', async (req, res) => {
    const { username } = req.body
    let user ='';
    try {
        user = await pool.query('SELECT * FROM users WHERE user_name = ($1)', [username]);
        if(!user.rows[0]){
            const newSession = await pool.query('INSERT INTO users(user_name) VALUES ($1) RETURNING *', [username]);
        }        
        return res.status(200).send(user.rows);
    } catch (err) {
        return res.status(400).send(err);
    }
});

app.post('/todo/:user_id', async (req, res) => {
    const { description, done } = req.body;
    const { user_id } = req.params;
    try {
        const newTodo = await pool.query('INSERT INTO todos (todo_description, todo_done, userId) VALUES ($1, $2, $3) RETURNING *', [description, done, user_id]);
        return res.status(200).send(newTodo.rows);
    } catch (err) {
        return res.status(400).send(err);
    }
});

app.get('/todo/:user_id', async (req, res) => {
    const { user_id } = req.params;
    try {
        const allTodos = await pool.query('SELECT * FROM todos WHERE userId = ($1)', [user_id]);
        return res.status(200).send(allTodos.rows);
    } catch (err) {
        return res.status(400).send(err);
    }
});

app.patch('/todo/:user_id/:todo_id', async (req, res) => {
    const { todo_id, user_id } = req.params;
    const data = req.body;
    try {
        const belongsToUser = await pool.query('SELECT * FROM todos WHERE userId = ($1) AND todoId = ($2)', [user_id, todo_id]);
        if (!belongsToUser.rows[0]) return res.status(400).send('Operation not allowed');
        const updatedTodo = await pool.query('UPDATE todos SET todo_description = ($1), todo_done = ($2) WHERE todoId = ($3) RETURNING *',
        [data.description, data.done, todo_id]);
        return res.status(200).send(updatedTodo.rows);
    } catch (err) {
        return res.status(400).send(err);
    }
});

app.delete('/todo/:user_id/:todo_id', async (req, res) => {
    const { user_id, todo_id } = req.params;
    try {
        const belongsToUser = await pool.query('SELECT * FROM todos WHERE userId = ($1) AND todoId = ($2)', [user_id, todo_id]);
        if (!belongsToUser.rows[0]) return res.status(400).send('Operation not allowed');
        const deletedTodo = await pool.query('DELETE FROM todos WHERE todoId = ($1) RETURNING *', [todo_id]);
        return res.status(200).send({
            message: 'Todo sucessfully deleted',
            deletedTodo: deletedTodo.rows
        });
    } catch (err) {
        res.status(400).send(err)
    }
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));