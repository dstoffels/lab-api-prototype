const express = require('express');
const bodyParser = require('body-parser');
const labs = require('./data');
const axios = require('axios');
const OpenAI = require('openai');
require('dotenv').config();
const openai = new OpenAI(process.env.OPENAI_API_KEY);

const app = express();
const PORT = 5000;

app.use(bodyParser.json());

// Get all labs
app.get('/labs', (req, res) => {
	res.json(labs);
});

// Get a specific lab by ID
app.get('/labs/:id', (req, res) => {
	const lab = labs.find((l) => l.id === parseInt(req.params.id));
	if (lab) {
		res.json(lab);
	} else {
		res.status(404).send('Lab not found');
	}
});

// EDIT LAB
app.patch('/labs/:id', (req, res) => {
	const lab = labs.find((l) => l.id === parseInt(req.params.id));

	if (!lab) {
		return res.status(404).send('Lab not found');
	}

	lab.name = req.body.name;

	res.json(lab);
});

// Add a new lab
app.post('/labs', (req, res) => {
	const { name, notes } = req.body;

	const newLab = {
		id: labs.length + 1,
		name,
		notes,
		tasks: [],
	};

	labs.push(newLab);
	res.status(201).json(newLab);
});

// Add a new task to a lab
app.post('/labs/:id/tasks', (req, res) => {
	const lab = labs.find((l) => l.id === parseInt(req.params.id));
	if (!lab) {
		return res.status(404).send('Lab not found');
	}
	const newTask = {
		id: lab.tasks.length + 1,
		description: req.body.description,
		completed: false,
	};
	lab.tasks.push(newTask);
	res.status(201).json(newTask);
});

// Get a task
app.get('/labs/:labId/tasks/:taskId', (req, res) => {
	const { labId, taskId } = req.params;

	const lab = labs.find((l) => l.id === parseInt(labId));
	if (!lab) {
		return res.status(404).send('Lab not found');
	}

	const task = lab.tasks.find((t) => t.id === parseInt(taskId));
	if (!task) {
		return res.status(404).send('Task not found');
	}

	res.status(200).json(task);
});

// EDIT TASK
// EDIT LAB
app.patch('/labs/:labId/tasks/:taskId', (req, res) => {
	const lab = labs.find((l) => l.id === parseInt(req.params.labId));
	const task = labs.find((l) => l.id === parseInt(req.params.taskId));

	if (!lab) {
		return res.status(404).send('Lab not found');
	}
	if (!task) {
		return res.status(404).send('Task not found');
	}

	lab.name = req.body.name;

	res.json(lab);
});

// SUBMIT TASK
app.post('/labs/:labId/tasks/:taskId/submit', async (req, res) => {
	const { labId, taskId } = req.params;
	const submittedCode = req.body.code;

	const lab = labs.find((l) => l.id === parseInt(labId));
	const task = lab.tasks.find((t) => t.id === parseInt(taskId));

	if (!lab) {
		return res.status(404).send('Lab not found');
	}
	if (!task) {
		return res.status(404).send('Task not found');
	}

	const completion = await openai.chat.completions.create({
		model: 'gpt-3.5-turbo',
		messages: [
			{
				role: 'system',
				content: `You are a ${task.language} instructor. You can only respond with a single JSON object. This object contains two properties: {task_complete: boolean, explanation: string}. You will evaluate a student's code against a given task to determine if the student completed the task and give them an explanation if not. This explanation cannot give away the actual answer.`,
			},
			{
				role: 'user',
				content: `Student's task: ${task.description}; Student's code: ${submittedCode}`,
			},
		],
	});

	res.status(200).json(JSON.parse(completion.choices[0].message.content));
});

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
