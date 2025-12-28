'use client';

import { useState } from 'react';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');

  const addTodo = () => {
    if (input.trim()) {
      const newTodo: Todo = {
        id: Date.now().toString(),
        text: input,
        completed: false,
      };
      setTodos([...todos, newTodo]);
      setInput('');
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-24">
      <h1 className="text-4xl font-bold mb-8">CashFlowTodo</h1>
      <div className="w-full max-w-md">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-4"
          placeholder="Add a new todo"
        />
        <button onClick={addTodo} className="w-full bg-blue-500 text-white p-2 rounded mb-4">Add Todo</button>
        <ul className="space-y-2">
          {todos.map(todo => (
            <li key={todo.id} className="flex items-center justify-between p-2 border border-gray-300 rounded">
              <span className={todo.completed ? 'line-through' : ''}>{todo.text}</span>
              <div>
                <button onClick={() => toggleTodo(todo.id)} className="mr-2 text-green-500">✓</button>
                <button onClick={() => deleteTodo(todo.id)} className="text-red-500">✗</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}