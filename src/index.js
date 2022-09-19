const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');
const { restart } = require('nodemon');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const {username} = request.headers;
  const userAccount = users.find(account => account.username === username);
  if(!userAccount)
    return response.status(404).json({error: "User not registered."});

  request.account = userAccount;
  return next();
}

function checksExistsTodo(request, response, next) {
  const {account} = request;
  const {id} = request.params;

  const todo = account.todos.find(todo => todo.id === id);
  if(!todo)
    return response.status(404).json({error: "There is no todo with this id."});

  request.todo = todo;
  return next();
}

app.post('/users', (request, response) => {
  const {name, username} = request.body;
  const isUserRegistered = users.some(account => account.username === username);

  if(isUserRegistered)
    return response.status(400).json({error: "There already is a user using this username."});
  
  const user = {
    name,
    username,
    id: uuidv4(),
    todos: []
  }

  users.push(user);
  return response.status(200).json(user);
});


app.get('/todos', checksExistsUserAccount, (request, response) => {
  const {account} = request;
  return response.status(200).json(account.todos);

});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const {account} = request;
  const {title, deadline} = request.body;

  const todo = {
    title,
    deadline: new Date(deadline),
    id: uuidv4(),
    done: false,
    created_at:new Date(),
  }

  account.todos.push(todo);
  return response.status(201).json(todo);
});

app.put('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const {todo} = request;
  const {title, deadline} = request.body;

  todo.title = title;
  todo.deadline = new Date(deadline);
  return response.status(200).json(todo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const {todo} = request;
  todo.done = true;
  return response.status(200).json(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const {account, todo} = request;
  account.todos.splice(account.todos.indexOf(todo), 1);
  return response.status(204).send();
});

module.exports = app;